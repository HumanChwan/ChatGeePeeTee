import multer from "multer";
import { AuthenticatedUserRequest } from "./types";
import path from "path";

const profilePictureStorage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, path.join("public", "images", "profile"));
    },
    filename: (_req, file, cb) => {
        const req = _req as AuthenticatedUserRequest;
        const randomSuffix = Date.now() + Math.floor(Math.random() * 1e9);

        const filename = file.originalname;

        cb(null, `${req.userId}-${randomSuffix}.${filename.split(".").pop()}`);
    },
});
export const profilePictureUpload = multer({ storage: profilePictureStorage });
