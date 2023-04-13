import { Request, Response } from "express";
import { AuthenticatedUserRequest, IOAuthenticatedUserRequest } from "../types";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../prisma";

import { Member, Chat, Message } from "../types";
import { DISAPPEARING_TIME, FILE_SCOPE, FORM_STATIC_URL, GET_PATH } from "../utils";
import { groupPictureUpload } from "../multer";

import * as fs from "fs/promises";
import path from "path";

const getMembersOfGroup = async (cid: string): Promise<Member[] | null> => {
    const members = await prisma.member.findMany({
        where: { AND: [{ cid: cid }, { removed: false }] },
        select: {
            user: {
                select: {
                    id: true,
                    username: true,
                    picture: true,
                },
            },
            admin: true,
        },
    });

    if (!members) return null;

    return members.map((member) => ({
        userId: member.user.id,
        username: member.user.username,
        picture: member.user.picture,
        admin: member.admin,
    }));
};

// Function to remove messages which are marked disappearing and
const updateMessageTable = async (cid: string): Promise<void> => {
    try {
        await prisma.message.deleteMany({
            where: {
                cid: cid,
                disappearing: true,
                createdAt: {
                    lte: new Date(Date.now() - DISAPPEARING_TIME),
                },
            },
        });
    } catch (err) {
        console.error(err);
        console.error(`For some reason chat with id: ${cid}, doesn't exist`);
    }
};

export const getChats = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    try {
        const memberChats = await prisma.member.findMany({
            where: { uid: req.userId },
            orderBy: { chat: { lastMessage: "desc" } },
            select: {
                chat: {
                    select: {
                        id: true,
                        dm: true,
                        name: true,
                        picture: true,
                        lastMessage: true,
                        disappearingMode: true,
                    },
                },
            },
        });

        const promises: Promise<Chat>[] = memberChats.map(async ({ chat }) => {
            const members = await getMembersOfGroup(chat.id);

            if (!members) {
                throw "Could not find no members in the Chat";
            }

            if (chat.dm) {
                const otherMember = members.filter(({ userId }) => userId !== req.userId);

                if (otherMember.length === 1) {
                    chat.name = otherMember[0].username;
                    chat.picture = otherMember[0].picture;
                }
            }
            await updateMessageTable(chat.id);
            const messages = await prisma.message.findMany({
                where: { cid: chat.id },
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    member: { select: { removed: true } },
                    user: {
                        select: {
                            id: true,
                            username: true,
                            picture: true,
                        },
                    },
                    content: true,
                    filePath: true,
                },
            });

            if (!messages) {
                throw "Could not find chat";
            }

            const sanitisedMessages: Message[] = messages.map((message) => {
                return {
                    id: message.id,
                    userId: message.user.id,
                    senderName: message.user.username,
                    senderPicture: message.user.picture,
                    removed: message.member.removed,
                    content: message.content,
                    fileLink: message.filePath,
                    fileName: message.filePath?.split("/").pop(),
                };
            });

            return { ...chat, messages: sanitisedMessages, members };
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

export const getMembers = async (req: Request, res: Response) => {
    const { cid } = req.query;

    if (!cid || typeof cid !== "string")
        return res.status(400).json({ success: false, message: "Malformed Query" });

    try {
        const members = await getMembersOfGroup(cid);

        if (!members)
            return res
                .status(403)
                .json({ success: false, message: "Chat with that cid doesn't exist" });

        return res
            .status(200)
            .json({ success: true, message: `Found ${members.length} members`, members });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

interface SerialisedMember {
    userId: string;
    username: string;
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
            where: identificationAsId
                ? { id: userIdentification }
                : { username: userIdentification },
            select: { id: true, username: true, picture: true },
        });
        if (!user) return null;

        await prisma.member.upsert({
            where: { uid_cid: { uid: user.id, cid: chatId } },
            create: {
                uid: user.id,
                cid: chatId,
                removed: false,
                admin,
            },
            update: { removed: false },
        });

        // TODO: add socket id instead garbage
        return {
            userId: user.id,
            username: user.username,
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
        // Check if username is of the same person as the one creating the DM
        const requestingUser = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { username: true },
        });
        if (!requestingUser)
            return res
                .status(403)
                .json({ success: false, message: "User with that Id doesn't exist" });

        if (username === requestingUser.username)
            return res
                .status(403)
                .json({ success: false, message: "Can't make a DM with same user" });

        const chat = await prisma.chat.create({
            data: {
                id: uuidv4(),
                dm: true,
                lastMessage: new Date(),
                disappearingMode: false,
            },
        });

        const userOne = await createMember(req.userId, chat.id, true, true);
        const userTwo = await createMember(username, chat.id, true);

        if (!userOne || !userTwo) {
            return res
                .status(403)
                .json({ success: false, message: "User with that Id doesn't exist" });
        }

        const chatForOne: Chat = {
            id: chat.id,
            dm: true,
            name: userTwo.username,
            picture: userTwo.picture,
            lastMessage: new Date(),
            disappearingMode: false,
            messages: [],
            members: [
                {
                    ...userOne,
                    admin: true,
                },
                {
                    ...userTwo,
                    admin: true,
                },
            ],
        };

        // TODO: socket send to the second USER
        const chatForTwo: Chat = {
            ...chatForOne,
            name: userOne.username,
            picture: userOne.picture,
        };

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
                disappearingMode: false,
            },
        });

        const promises: Promise<SerialisedMember | null>[] = [
            createMember(req.userId, chat.id, true, true),
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
            dm: false,
            name: chat.name,
            picture: null,
            lastMessage: new Date(),
            disappearingMode: chat.disappearingMode,
            messages: [],
            members: serialisedMembers.map((member) => ({
                userId: member!.userId,
                picture: member!.picture,
                username: member!.username,
                admin: false,
            })),
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

export const recordMessage = async (_req: Request, res: Response) => {};

export const addGroupMember = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body.username || !req.body.cid)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        await createMember(req.body.username, req.body.cid, false);

        const members = await getMembersOfGroup(req.body.cid);

        if (!members) return res.status(403).json({ success: false, message: "Some random error" });

        return res
            .status(200)
            .json({ success: false, message: `Found ${members.length} member(s)`, members });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const leaveGroup = async (_req: Request, res: Response) => {
    const req = _req as IOAuthenticatedUserRequest;

    if (!req.body.cid) return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        await prisma.member.update({
            where: { uid_cid: { uid: req.userId, cid: req.body.cid } },
            data: { removed: true },
        });

        // Socket stuff
        req.io.in(`user-${req.userId}`).socketsLeave(`chat-${req.body.cid}`);
        // TODO: send message to all members of the chat

        return res.status(200).json({ success: true, message: "Left the group" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateGroup = (_req: Request, res: Response) => {};

export const updateGroupPhoto = (_req: Request, res: Response) => {
    groupPictureUpload.single("profile_photo")(_req, res, async (err) => {
        const req = _req as AuthenticatedUserRequest;
        if (err || !req.file) {
            console.error(`[#] ${err}`);
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        if (!req.body || !req.body.cid)
            return res.status(400).json({ success: false, message: "Malformed Body" });

        try {
            const pictureObj = await prisma.chat.findUnique({
                where: { id: req.body.cid },
                select: { picture: true },
            });
            if (!pictureObj) return res.status(403).json({ success: false, message: "Forbidden" });

            await prisma.user.update({
                where: { id: req.userId },
                data: { picture: req.file.filename },
            });

            try {
                if (pictureObj.picture)
                    await fs.unlink(
                        path.join(GET_PATH[FILE_SCOPE.GROUP_PROFILE], pictureObj.picture)
                    );
            } catch (err) {
                console.error(
                    `Coulndn't find "${pictureObj.picture}" in profile images directory!`
                );
            }

            // TODOO: Send update to all group members

            return res.status(200).json({
                success: true,
                message: "Updated successfully!",
                image: FORM_STATIC_URL(req.file.filename, FILE_SCOPE.GROUP_PROFILE),
            });
        } catch (err) {
            console.error(`[#] ${err}`);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    });
};

export const removeGroupMember = async (_req: Request, res: Response) => {
    const req = _req as IOAuthenticatedUserRequest;

    if (!req.body.uid || !req.body.cid)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        await prisma.member.update({
            where: { uid_cid: { uid: req.body.uid, cid: req.body.cid } },
            data: { removed: true },
        });

        // Socket Stuff
        req.io.in(`user-${req.body.uid}`).socketsLeave(`chat-${req.body.cid}`);
        // TODO: send message to all members of the chat

        const members = await getMembersOfGroup(req.body.cid);

        if (!members) return res.status(403).json({ success: false, message: "Some random error" });

        return res
            .status(200)
            .json({ success: true, message: `Found ${members.length} member(s)`, members });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const toggleAdminStatus = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body.uid || !req.body.cid)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    try {
        const memberAdminStatus = await prisma.member.findUnique({
            where: { uid_cid: { uid: req.body.uid, cid: req.body.cid } },
            select: { admin: true },
        });

        if (!memberAdminStatus)
            return res
                .status(403)
                .json({ success: false, message: "Member with that Id doesn't exist" });

        await prisma.member.update({
            where: { uid_cid: { uid: req.body.uid, cid: req.body.cid } },
            data: {
                admin: !memberAdminStatus,
            },
        });

        const members = await getMembersOfGroup(req.body.cid);

        if (!members)
            return res
                .status(403)
                .json({ success: false, message: "Member with that Id doesn't exist" });

        return res
            .status(200)
            .json({ success: true, message: `Found ${members.length} member(s)`, members });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
