import multer from "multer";
import { AuthenticatedUserRequest } from "./types";
import path from "path";
import { FILE_SCOPE, GET_PATH } from "./utils";

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

const groupPictureStorage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, GET_PATH[FILE_SCOPE.GROUP_PROFILE]);
    },
    filename: (_req, file, cb) => {
        const req = _req as AuthenticatedUserRequest;

        if (!req.body || !req.body.cid) return cb(Error("No CID"), file.filename);

        const randomSuffix = Date.now() + Math.floor(Math.random() * 1e9);

        const filename = file.originalname;

        cb(null, `${req.body.cid}-${randomSuffix}.${filename.split(".").pop()}`);
    },
});
export const groupPictureUpload = multer({ storage: groupPictureStorage });
