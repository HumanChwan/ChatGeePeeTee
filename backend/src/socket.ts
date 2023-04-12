import { Server, Socket } from "socket.io";
import { AuthenticatedUserSocket, Message } from "./types";

const handleSocketConnection = (io: Server) => async (_socket: Socket) => {
    const socket = _socket as AuthenticatedUserSocket;
    console.log(`Socket connected with userID: ${socket.userId}, socketID: ${socket.id}`);

    socket.on("message:send", () => {});
};

export default handleSocketConnection;
