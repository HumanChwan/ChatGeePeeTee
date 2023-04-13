import { Router } from "express";
import { authorization, groupAdminAuthorization } from "../middlewares/authentication";
import {
    addGroupMember,
    createDM,
    createGroup,
    getChats,
    getMembers,
    leaveGroup,
    recordMessage,
    removeGroupMember,
    toggleAdminStatus,
    updateGroup,
    updateGroupPhoto,
} from "../controllers/chat";

const router = Router();

// Normal Member routes
router.use(authorization);

router.get("/get-chats", getChats);
router.get("/get-members", getMembers);
router.get("/leave-group", leaveGroup);
router.post("/create-dm", createDM);
router.post("/create-group", createGroup);

router.post("/message", recordMessage);

// Group Admin routes
router.use(groupAdminAuthorization);

router.post("/add-group-member", addGroupMember);

router.post("/update-group", updateGroup);
router.post("/update-group-picture", updateGroupPhoto);

router.post("/remove-member", removeGroupMember);
router.post("/toggle-admin-status", toggleAdminStatus);

export default router;
