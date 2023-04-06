import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config/config";
import { AuthenticatedUserRequest } from "../types";

export const authorization = (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies) return res.status(403).json({ success: false, message: "Forbidden" });
    console.log(req.cookies)

    const token = req.cookies.jwt;

    if (!token) return res.status(403).json({ success: false, message: "Forbidden" });

    try {
        const data = jwt.verify(token, TOKEN_SECRET);
        console.log(data)
        if (typeof data === "string" || data instanceof String) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        (req as AuthenticatedUserRequest).userId = data.id;

        next();
    } catch (err) {
        console.log(err)
        return res.status(403).json({ success: false, message: "Forbidden" });
    }
};
