import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { AuthenticatedUserRequest } from "../types";
import { prisma } from "../prisma";
import { serializeUser } from "../utils";
import { COOKIE_CONFIG, TOKEN_SECRET } from "../config/config";

export const signup = async (req: Request, res: Response) => {
    const { body } = req;

    if (!body) {
        return res.status(400).json({ success: false, message: "Malformed body" });
    }

    const { name, email, password, username } = body;
    
    if (!name || !email || !password || !username)  
        return res.status(400).json({ success: false, message: "Malformed body" });

    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const id = uuidv4();

        const user = await prisma.user.create({
            data: {
                id,
                name,
                password: hashedPassword,
                email,
                username,
                online: false,
                lastOnline: new Date()
            }
        })

        return res.status(200).json({ success: true, message: "Created new user", user: serializeUser(user) })
    } catch (err) {
        return res.status(403).json({ success: false, message: "Couldn't insert into the database" });
    }
};

export const login = async (req: Request, res: Response) => {
    const { body } = req;
    if (!body) {
        return res.status(400).json({ success: false, message: "Malformed body" });
    }

    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ success: false, message: "Malformed body" });

    try {
        const user =
            (await prisma.user.findUnique({
                where: { username },
            })) ||
            (await prisma.user.findUnique({
                where: { email: username },
            }));

        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const result = await bcrypt.compare(password, user.password);

        if (!result) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const token = jwt.sign({ id: user.id }, TOKEN_SECRET, {
            expiresIn: "10d",
        });

        return res.cookie("jwt", token, COOKIE_CONFIG).status(200).json({
            success: true,
            message: "Logged in successfully!",
            user: serializeUser(user)
        })
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const logout = (_: Request, res: Response) => {
    return res
        .clearCookie("jwt")
        .status(200)
        .json({ success: true, message: "Logged out successfully!" });
};

export const getUser = async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedUserRequest;

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
        });

        if (!user) {
            return res.status(401).json({ success: false, message: "Unidentified Id" });
        }

        return res
            .status(200)
            .json({ success: true, message: "Valid User", user: serializeUser(user) });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const checkUsername = async (req: Request, res: Response) => {
    const { body } = req;
    if (!body || !body.username) {
        return res.status(400).json({ success: false, message: "Malformed body" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username: body.username },
            select: { id: true },
        });

        return res.status(200).json({ success: !user });
    } catch (err) {
        console.error(`[#] Error: ${err}`)
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
