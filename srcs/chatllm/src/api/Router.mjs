import { Router } from "express";
import { 
    loadDocument,
    newChat, 
    generate, 
    getChatHistory, 
    postChat, 
    editChat,
    getChatboxes,
    deleteHistory
} from "./Controller.mjs";
import { isAuth } from "./middleware/auth.mjs";

const router = Router();

router.post("/load-document", loadDocument);
router.post("/new-chat", isAuth, newChat);
router.post("/generate", generate);
router.post("/chat/:id", isAuth, postChat);
router.get("/chat", isAuth, getChatboxes);
router.get("/history/:id", isAuth, getChatHistory);
router.put("/chat/:id/:msgId", isAuth, editChat);
router.delete("/history/:id", isAuth, deleteHistory);

export default router;