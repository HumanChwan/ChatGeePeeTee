import { Router } from "express";

import {
    checkUsername,
    getUser,
    login,
    logout,
    signup,
    updateProfilePicture,
} from "../controllers/authentication";
import { authorization } from "../middlewares/authentication";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.post("/check-username", checkUsername);

router.get("/get-user", authorization, getUser);
router.post("/update-profile-picture", authorization, updateProfilePicture);

export default router;
