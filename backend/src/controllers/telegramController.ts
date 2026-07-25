import { Request, Response } from "express";
import { getTelegramBot } from "../utils/telegramBot";

// Telegram calls this directly once the webhook is registered (see
// scripts/registerTelegramWebhook.ts) — this is what makes the bot work on
// a serverless deployment, where nothing can stay running to long-poll.
export const receiveTelegramUpdate = async (req: Request, res: Response) => {
    // Telegram echoes the secret_token set during registration back on every
    // real request via this header — without checking it, anyone who finds
    // the URL could POST forged updates (e.g. fake messages for a real
    // connected chat id) and have them processed as if Telegram sent them.
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const providedSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (expectedSecret && providedSecret !== expectedSecret) {
        res.sendStatus(401);
        return;
    }

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
