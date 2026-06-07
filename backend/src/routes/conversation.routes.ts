import { Router } from "express";

import { isAuth } from "../middlewares/is-auth";
import { chat, deleteConversation, getConversation, getConversations } from "../controllers/conversation.controller";

const router: Router = Router();

router.get("/", isAuth, getConversations);

router.get("/:conversationId", isAuth, getConversation);

router.post("/chat/{:conversationId}", isAuth, chat);

router.delete("/delete/:conversationId", isAuth, deleteConversation);

export default router;
