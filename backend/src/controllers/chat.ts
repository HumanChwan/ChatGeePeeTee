import { Request, Response } from "express";
import { AuthenticatedUserRequest } from "../types";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../prisma";

interface Chat {
    messages: {
        id: string;
        userId: string;
        senderName: string;
        senderPicture: string | null;
        content: string | null;
        fileLink: string | null;
        fileName: string | undefined;
    }[];
    id: string;
    dm: boolean;
    name: string | null;
    picture: string | null;
    lastMessage: Date;
}
export const getChats = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    try {
        const memberChats = await prisma.member.findMany({
            where: { uid: req.userId },
            select: {
                chat: {
                    select: {
                        id: true,
                        dm: true,
                        name: true,
                        picture: true,
                        lastMessage: true,
                    },
                },
            },
        });

        const promises: Promise<Chat>[] = memberChats.map(async ({ chat }) => {
            if (chat.dm) {
                const membersOfDM = await prisma.chat.findUnique({
                    where: { id: chat.id },
                    select: {
                        participants: {
                            select: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        picture: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if (membersOfDM) {
                    const otherMember = membersOfDM.participants.filter(
                        ({ user }) => user.id !== req.userId
                    );

                    if (otherMember.length === 1) {
                        chat.name = otherMember[0].user.name;
                        chat.picture = otherMember[0].user.picture;
                    }
                }
            }
            const messages = await prisma.chat.findUnique({
                where: { id: chat.id },
                select: {
                    messages: {
                        select: {
                            id: true,
                            sender: {
                                select: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            picture: true,
                                        },
                                    },
                                },
                            },
                            content: true,
                            filePath: true,
                        },
                    },
                },
            });

            if (!messages) {
                throw "Could not find chat";
            }

            const sanitisedMessages = messages.messages.map((message) => {
                return {
                    id: message.id,
                    userId: message.sender.user.id,
                    senderName: message.sender.user.name,
                    senderPicture: message.sender.user.picture,
                    content: message.content,
                    fileLink: message.filePath,
                    fileName: message.filePath?.split("/").pop(),
                };
            });

            return { ...chat, messages: sanitisedMessages };
        });

        const chats: Chat[] = await Promise.all(promises);

        return res
            .status(200)
            .json({ success: true, message: `Found ${chats.length} chat(s)`, chats });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

interface SerialisedMember {
    id: string;
    name: string;
    picture: string | null;
    socketId: string;
}
const createMember = async (
    userIdentification: string,
    chatId: string,
    admin: boolean,
    identificationAsId: boolean = false
): Promise<SerialisedMember | null> => {
    try {
        const user = await prisma.user.findUnique({
            where: identificationAsId ? { id: userIdentification } : {username: userIdentification},
            select: { id: true, name: true, picture: true },
        });
        if (!user) return null;

        await prisma.member.create({
            data: {
                id: uuidv4(),
                uid: user.id,
                cid: chatId,
                admin,
            },
        });

        // TODO: add socket id instead garbage
        return {
            id: userIdentification,
            name: user.name,
            picture: user.picture,
            socketId: "socket-id",
        };
    } catch (err) {
        return null;
    }
};

export const createDM = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body) {
        return res.status(400).json({ success: false, message: "Malformed Body" });
    }

    const { username } = req.body;

    if (!username) return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        const chat = await prisma.chat.create({
            data: {
                id: uuidv4(),
                dm: true,
                lastMessage: new Date(),
            },
        });

        const userOne = await createMember(req.userId, chat.id, true, true);
        const userTwo = await createMember(username, chat.id, true);

        if (!userOne || !userTwo) {
            return res
                .status(400)
                .json({ success: false, message: "User with that Id doesn't exist" });
        }

        const chatForOne: Chat = {
            id: chat.id,
            dm: true,
            name: userTwo.name,
            picture: userTwo.picture,
            lastMessage: new Date(),
            messages: [],
        };

        // TODO: socket send to the second USER
        const chatForTwo: Chat = { ...chatForOne, name: userOne.name, picture: userOne.picture };

        return res.status(200).json({ success: true, message: "Create new DM", chat: chatForOne });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

interface AddableMember {
    username: string;
    admin: boolean;
}
export const createGroup = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body) {
        return res.status(400).json({ success: false, message: "Malformed Body" });
    }

    const { members, groupName } = req.body;

    if (!members || !(members instanceof Object) || !groupName)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        const chat = await prisma.chat.create({
            data: {
                id: uuidv4(),
                dm: false,
                lastMessage: new Date(),
                name: groupName,
            },
        });

        const promises: Promise<SerialisedMember | null>[] = [
            createMember(req.userId, chat.id, true),
            ...members.map((member: AddableMember) => {
                return createMember(member.username, chat.id, member.admin);
            }),
        ];

        const serialisedMembers = (await Promise.all(promises)).filter((x) => !!x);

        if (serialisedMembers.includes(null)) {
            return res
                .status(400)
                .json({ success: false, message: "User with that Id doesn't exist" });
        }

        const serialisedChat: Chat = {
            id: chat.id,
            dm: true,
            name: chat.name,
            picture: null,
            lastMessage: new Date(),
            messages: [],
        };

        serialisedMembers.forEach((member) => {
            // TODO: socket send to the all the other USERs
            // Send `serialisedChat` to every member
            // Use member here to send through socket
        });

        return res
            .status(200)
            .json({ success: true, message: "Create new DM", chat: serialisedChat });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateGroupName = (_req: Request, res: Response) => {

}

export const updateGroupPhoto = (_req: Request, res: Response) => {

}
