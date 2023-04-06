import { Router } from "express";

import { checkUsername, getUser, login, logout, signup } from "../controllers/authentication";
import { authorization } from "../middlewares/authentication";

const router = Router()

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.get("/get-user", authorization, getUser);
router.post("/check-username", checkUsername);


export default router;
