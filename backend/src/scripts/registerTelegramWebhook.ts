import "dotenv/config";
import { Telegraf } from "telegraf";

// One-time (re-)registration of the Telegram webhook URL — run manually
// after each deploy where the public URL changes (first deploy, or a new
// custom domain). Not part of the app's request path.
//
// Usage: npx tsx src/scripts/registerTelegramWebhook.ts https://your-app.vercel.app/api/telegram/webhook
const run = async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = process.argv[2];

    if (!token) {
        throw new Error("TELEGRAM_BOT_TOKEN is not set");
    }
    if (!url) {
        throw new Error(
            "Usage: npx tsx src/scripts/registerTelegramWebhook.ts <https://your-domain>/api/telegram/webhook"
        );
    }

    const bot = new Telegraf(token);
    await bot.telegram.setWebhook(url);
    const info = await bot.telegram.getWebhookInfo();
    console.log("Webhook registered:", info);
};

run().catch((err) => {
    console.error("Failed to register webhook:", err);
    process.exit(1);
});
