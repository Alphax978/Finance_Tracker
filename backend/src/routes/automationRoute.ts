import express from "express";
import { generateLinkCode, getIntegrations, disconnectIntegration } from "../controllers/automationController";
import { requireSelf } from "../middleware/auth";

const automationRouter = express.Router();

automationRouter.get("/:userId", requireSelf, getIntegrations);
automationRouter.post("/:userId/link-code", requireSelf, generateLinkCode);
automationRouter.delete("/:userId/:platform", requireSelf, disconnectIntegration);

export default automationRouter;
