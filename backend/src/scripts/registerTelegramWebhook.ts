import "dotenv/config";

// One-time (re-)registration of the Telegram webhook URL — run manually
// after each deploy where the public URL changes (first deploy, a new
// custom domain, or after any local `npm run dev` session, since starting
// long-polling locally deletes the production webhook). Not part of the
// app's request path.
//
// Uses the raw Bot API directly (not Telegraf's wrapper) because the
// installed Telegraf version's types don't include secret_token yet, even
// though the real API has supported it since Bot API 6.0.
//
// Usage: npx tsx src/scripts/registerTelegramWebhook.ts https://your-app.vercel.app/api/telegram/webhook
const run = async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const url = process.argv[2];

    if (!token) {
        throw new Error("TELEGRAM_BOT_TOKEN is not set");
    }
    if (!secret) {
        throw new Error("TELEGRAM_WEBHOOK_SECRET is not set");
    }
    if (!url) {
        throw new Error(
            "Usage: npx tsx src/scripts/registerTelegramWebhook.ts <https://your-domain>/api/telegram/webhook"
        );
    }

    const setResponse = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, secret_token: secret }),
    });
    console.log("setWebhook result:", await setResponse.json());

    const infoResponse = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    console.log("Webhook info:", await infoResponse.json());
};

run().catch((err) => {
    console.error("Failed to register webhook:", err);
    process.exit(1);
});
