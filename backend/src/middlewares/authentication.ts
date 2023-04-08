import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config/config";
import { AuthenticatedUserRequest } from "../types";
import { prisma } from "../prisma";

export const authorization = (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies) return res.status(403).json({ success: false, message: "Forbidden" });

    const token = req.cookies.jwt;

    if (!token) return res.status(403).json({ success: false, message: "Forbidden" });

    try {
        const data = jwt.verify(token, TOKEN_SECRET);
        if (typeof data === "string" || data instanceof String) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        (req as AuthenticatedUserRequest).userId = data.id;

        next();
    } catch (err) {
        console.log(err);
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
};

export const groupAdminAuthorization = async (_req: Request, res: Response, next: NextFunction) => {
    const req = _req as AuthenticatedUserRequest;

    if (!req.body || !req.body.cid)
        return res.status(400).json({ success: false, message: "Malformed Body" });

    if (!req.userId) return res.status(403).json({ success: false, message: "Forbidden" });

    try {
        const member = await prisma.member.findUnique({
            where: { uid_cid: { uid: req.userId, cid: req.body.cid } },
            select: { admin: true },
        });

        if (!member || !member.admin)
            return res.status(403).json({ success: false, message: "Forbidden" });

        return next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
