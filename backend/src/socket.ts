import { Server, Socket } from "socket.io";
import { AuthenticatedUserSocket } from "./types";
import { prisma } from "./prisma";

const handleSocketConnection = (io: Server) => async (_socket: Socket) => {
    const socket = _socket as AuthenticatedUserSocket;
    console.log(`Socket connected with userID: ${socket.userId}, socketID: ${socket.id}`);

    const chats = await prisma.chat.findMany({
        where: { participants: { some: { uid: socket.userId } } },
        select: { id: true },
    });

    chats.forEach(({ id }) => {
        socket.join(`chat-${id}`);
    });
};

export default handleSocketConnection;
