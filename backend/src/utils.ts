import { User } from "@prisma/client";

export const serializeUser = (user: User) => {
    const { name, email, username, createdAt, picture } = user;
    return { name, email, username, createdAt, picture };
};
