import { Request } from "express";
import { Socket } from "socket.io";

export type AuthenticatedUserRequest = Request & { userId: string };
export type AuthenticatedUserSocket = Socket & { userId: string };

export interface Member {
    userId: string;
    username: string;
    picture: string | null;
    admin: boolean;
}
export interface Message {
    id: string;
    userId: string;
    senderName: string;
    senderPicture: string | null;
    removed: boolean;
    content: string | null;
    fileLink: string | null;
    fileName: string | undefined;
}
export interface Chat {
    messages: Message[];
    members: Member[];
    id: string;
    dm: boolean;
    name: string | null;
    picture: string | null;
    lastMessage: Date;
}
