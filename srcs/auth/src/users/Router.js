import { Router } from "express";
import { register, login } from "../middleware/Auth.js";
import { getToken, ping } from "./Controller.js";

const router = Router();

router.post("/login", login, getToken);
router.post("/register", register, getToken);
router.get("/ping", ping);

export default router;