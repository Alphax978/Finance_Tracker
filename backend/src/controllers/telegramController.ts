import { Request, Response } from "express";
import { getTelegramBot } from "../utils/telegramBot";

// Telegram calls this directly once the webhook is registered (see
// scripts/registerTelegramWebhook.ts) — this is what makes the bot work on
// a serverless deployment, where nothing can stay running to long-poll.
export const receiveTelegramUpdate = async (req: Request, res: Response) => {
    const bot = getTelegramBot();
    if (!bot) {
        res.sendStatus(200);
        return;
    }

    try {
        await bot.handleUpdate(req.body);
    } catch (err) {
        console.error("[telegram] Error handling webhook update:", err);
    }

    // Telegram only cares that we returned 200 promptly — the actual reply
    // (if any) already went out via a separate Bot API call inside the handler.
    res.sendStatus(200);
};
