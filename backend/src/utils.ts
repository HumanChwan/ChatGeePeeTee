import { User } from "@prisma/client";

export const serializeUser = (user: User) => {
    const { name, email, username, createdAt, picture, dark } = user;
    return { name, email, username, createdAt, picture, dark };
};
