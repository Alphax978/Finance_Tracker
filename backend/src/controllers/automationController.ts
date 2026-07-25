import { Request, Response } from "express";
import crypto from "crypto";
import LinkCodeModel from "../model/linkCodeModel";
import ChatIntegrationModel, { ChatPlatform } from "../model/chatIntegrationModel";

const PLATFORMS: ChatPlatform[] = ["telegram", "whatsapp", "messenger"];
const CODE_TTL_MS = 15 * 60 * 1000;

const getUserId = (req: Request): string | null => {
    const { userId } = req.params;
    if (!userId || Array.isArray(userId)) return null;
    return userId;
};

const isChatPlatform = (value: unknown): value is ChatPlatform =>
    typeof value === "string" && (PLATFORMS as string[]).includes(value);

export const generateLinkCode = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(400).json({ success: false, message: "userId is required" });
            return;
        }

        const { platform } = req.body;
        if (!isChatPlatform(platform)) {
            res.status(400).json({ success: false, message: "platform must be telegram, whatsapp, or messenger" });
            return;
        }

        // Replace any prior unused code for this user+platform so old codes can't be reused.
        await LinkCodeModel.deleteMany({ userId, platform });

        const code = crypto.randomBytes(4).toString("hex").toUpperCase();
        const expiresAt = new Date(Date.now() + CODE_TTL_MS);
        await new LinkCodeModel({ userId, platform, code, expiresAt }).save();

        res.status(200).json({
            success: true,
            code,
            expiresAt,
            botUsername: platform === "telegram" ? process.env.TELEGRAM_BOT_USERNAME ?? null : null,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to generate a linking code" });
    }
};

export const getIntegrations = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(400).json({ success: false, message: "userId is required" });
            return;
        }

        const integrations = await ChatIntegrationModel.find({ userId });
        res.status(200).json({ success: true, integrations });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch integrations" });
    }
};

export const disconnectIntegration = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { platform } = req.params;
        if (!userId || !isChatPlatform(platform)) {
            res.status(400).json({ success: false, message: "userId and a valid platform are required" });
            return;
        }

        await ChatIntegrationModel.findOneAndDelete({ userId, platform });
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to disconnect" });
    }
};
