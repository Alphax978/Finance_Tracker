import express from "express";
import {
    getSubscriptionStatus,
    createCheckoutSession,
    createPortalSession,
} from "../controllers/subscriptionController";

const subscriptionRouter = express.Router();

subscriptionRouter.get("/:userId", getSubscriptionStatus);
subscriptionRouter.post("/:userId/checkout", createCheckoutSession);
subscriptionRouter.post("/:userId/portal", createPortalSession);

export default subscriptionRouter;
