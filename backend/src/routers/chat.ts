import { Router } from "express";
import { authorization } from "../middlewares/authentication";
import { createDM, createGroup, getChats } from "../controllers/chat";

const router = Router();

router.get("/get-chats", authorization, getChats);
router.post("/create-dm", authorization, createDM);
router.post("/create-group", authorization, createGroup);

export default router;
