import express from "express";
import { receiveTelegramUpdate } from "../controllers/telegramController";

const router = express.Router();

router.post("/webhook", receiveTelegramUpdate);

export default router;
