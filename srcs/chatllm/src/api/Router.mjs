import { Router } from "express";
import {
    newChat, 
    generate, 
    getChatHistory, 
    postChat, 
    editChat,
    getChatboxes,
    deleteHistory,
    getStream
} from "./Controller.mjs";
import { isAuth } from "./utils/auth.mjs";

const router = Router();

router.post("/new-chat", isAuth, newChat);
router.post("/generate", generate);
router.post("/chat/:id", isAuth, postChat);
router.post("/stream/:jobId", (req, res, next) => {
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    next();
}, getStream);
router.get("/chat", isAuth, getChatboxes);
router.get("/history/:id", isAuth, getChatHistory);
router.put("/chat/:id/:msgId", isAuth, editChat);
router.put("/history/:id", isAuth, () => {});
router.delete("/history/:id", isAuth, deleteHistory);

export default router;