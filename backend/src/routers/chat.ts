import { Router } from "express";
import { authorization, groupAdminAuthorization } from "../middlewares/authentication";
import {
    addGroupMember,
    createDM,
    createGroup,
    getChats,
    removeGroupMember,
    toggleAdminStatus,
    updateGroupName,
    updateGroupPhoto,
} from "../controllers/chat";

const router = Router();

router.get("/get-chats", authorization, getChats);
router.post("/create-dm", authorization, createDM);
router.post("/create-group", authorization, createGroup);

router.post("/add-group-member", authorization, groupAdminAuthorization, addGroupMember);

router.post("/update-group-name", authorization, groupAdminAuthorization, updateGroupName);
router.post("/update-group-picture", authorization, groupAdminAuthorization, updateGroupPhoto);

router.post("/remove-member", authorization, groupAdminAuthorization, removeGroupMember);
router.post("/toggle-admin-status", authorization, groupAdminAuthorization, toggleAdminStatus);

export default router;
