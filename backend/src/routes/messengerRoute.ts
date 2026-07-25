import express from "express";
import { verifyMessengerWebhook, receiveMessengerMessage } from "../controllers/messengerController";

const messengerRouter = express.Router();

messengerRouter.get("/webhook", verifyMessengerWebhook);
messengerRouter.post("/webhook", receiveMessengerMessage);

export default messengerRouter;
