import express from "express";
import {
    getSubscriptionStatus,
    createCheckoutSession,
    createPortalSession,
} from "../controllers/subscriptionController";
import { requireSelf } from "../middleware/auth";

const subscriptionRouter = express.Router();

subscriptionRouter.get("/:userId", requireSelf, getSubscriptionStatus);
subscriptionRouter.post("/:userId/checkout", requireSelf, createCheckoutSession);
subscriptionRouter.post("/:userId/portal", requireSelf, createPortalSession);

export default subscriptionRouter;
