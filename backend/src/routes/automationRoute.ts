import express from "express";
import { generateLinkCode, getIntegrations, disconnectIntegration } from "../controllers/automationController";

const automationRouter = express.Router();

automationRouter.get("/:userId", getIntegrations);
automationRouter.post("/:userId/link-code", generateLinkCode);
automationRouter.delete("/:userId/:platform", disconnectIntegration);

export default automationRouter;
