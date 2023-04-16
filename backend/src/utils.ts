import { User } from "@prisma/client";
import { SERVER_URL } from "./config/config";
import path from "path";

/// 5 hours in milliseconds
export const DISAPPEARING_TIME: number = 5 * 60 * 60 * 1000;

export enum FILE_SCOPE {
    PROFILE,
    GROUP_PROFILE,
    CHAT_FILE,
}
export const FORM_STATIC_URL = (localFilename: string | null, type: FILE_SCOPE) => {
    if (!localFilename) return null;

    switch (type) {
        case FILE_SCOPE.PROFILE:
            return `${SERVER_URL}/images/profile/${localFilename}`;
        case FILE_SCOPE.GROUP_PROFILE:
            return `${SERVER_URL}/images/group-profile/${localFilename}`;
        case FILE_SCOPE.CHAT_FILE:
            return `${SERVER_URL}/chat/${localFilename}`;
        default:
            throw "Well that's embarrassing :(";
    }
};

export const GET_PATH = {
    [FILE_SCOPE.PROFILE]: path.join("public", "images", "profile"),
    [FILE_SCOPE.GROUP_PROFILE]: path.join("public", "images", "group-profile"),
    [FILE_SCOPE.CHAT_FILE]: path.join("public", "chat"),
};

export const getChatFileName = (filename: string) => {
    // $$$$ acts as split filter, pretty sus lmaoo
    return filename.split("$$$$-").pop();
};

export const serializeUser = (user: User) => {
    const { name, email, username, createdAt, picture, dark } = user;
    return {
        name,
        email,
        username,
        createdAt,
        picture: FORM_STATIC_URL(picture, FILE_SCOPE.PROFILE),
        dark,
    };
};
