import { Telegraf } from "telegraf";
import { handleIncomingChatMessage } from "./chatAutomation";

let bot: Telegraf | null = null;

export const getTelegramBot = (): Telegraf | null => {
    if (bot) return bot;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return null;

    bot = new Telegraf(token);

    bot.start(async (ctx) => {
        const arg = ctx.message.text.split(" ")[1]?.trim();
        if (!arg) {
            await ctx.reply(
                "Welcome! To connect this chat, generate a code on the Automation page in Finance Tracker, then send /start <code> here."
            );
            return;
        }
        try {
            const reply = await handleIncomingChatMessage("telegram", String(ctx.chat.id), `connect ${arg}`);
            await ctx.reply(reply);
        } catch (err) {
            console.error("[telegram] Error handling /start:", err);
            await ctx.reply("Something went wrong connecting that code. Please try again.");
        }
    });

    bot.on("text", async (ctx) => {
        if (ctx.message.text.startsWith("/")) return;
        try {
            const reply = await handleIncomingChatMessage("telegram", String(ctx.chat.id), ctx.message.text);
            await ctx.reply(reply);
        } catch (err) {
            console.error("[telegram] Error handling message:", err);
            await ctx.reply("Something went wrong processing that message. Please try again.");
        }
    });

    // Belt-and-suspenders: Telegraf routes any error a handler doesn't catch
    // itself here instead of letting it become an unhandled rejection.
    bot.catch((err, ctx) => {
        console.error(`[telegram] Unhandled error for update ${ctx.update.update_id}:`, err);
    });

    return bot;
};

// Long-polling only makes sense on a persistently running process — local
// dev (npm run dev / node build/server.js). The production deployment runs
// as a Vercel serverless function instead, which receives updates via
// webhook (see controllers/telegramController.ts), so this is never called
// there.
export const launchTelegramBotPolling = () => {
    const instance = getTelegramBot();
    if (!instance) {
        console.warn("[telegram] TELEGRAM_BOT_TOKEN not set — Telegram automation is disabled.");
        return;
    }

    // launch() resolves once polling starts, but rejects if Telegram is
    // unreachable (bad token, network/DNS issue, Telegram blocked on this
    // network, etc.) — that must never be allowed to crash the rest of the
    // server, since Telegram is only one of several independent features.
    instance
        .launch()
        .then(() => console.log("[telegram] Bot launched (long polling)."))
        .catch((err) => {
            console.error("[telegram] Failed to launch — Telegram automation is disabled for this run:", err instanceof Error ? err.message : err);
        });

    process.once("SIGINT", () => instance.stop("SIGINT"));
    process.once("SIGTERM", () => instance.stop("SIGTERM"));
};
