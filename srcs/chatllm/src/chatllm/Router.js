import { Router } from "express";
import { ChatBox, ChatMessage } from "./Model.js";
import { verify } from "../middleware/jwt.js";
import { ping, chatList, chatHistory, deleteChatHistory } from "./Controller.js";

const router = Router();

router.get("/ping", verify, ping);
router.get("/chat-list", verify, chatList);
router.get("/chat/:chatBoxId", verify, chatHistory);
router.delete("/chat/:chatBoxId", verify, deleteChatHistory);

export default router;