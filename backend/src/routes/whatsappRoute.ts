import express from "express";
import { verifyWhatsappWebhook, receiveWhatsappMessage } from "../controllers/whatsappController";

const whatsappRouter = express.Router();

whatsappRouter.get("/webhook", verifyWhatsappWebhook);
whatsappRouter.post("/webhook", receiveWhatsappMessage);

export default whatsappRouter;
