import { Request, Response } from "express";
import { handleIncomingChatMessage } from "../utils/chatAutomation";

// --- Meta webhook verification (WhatsApp Cloud API) -----------------------
// Meta calls this once when you register the webhook URL in the app dashboard.
// Requires a real WhatsApp Business Account + app review before Meta will
// deliver real traffic here — this endpoint is correct but inert until then.
export const verifyWhatsappWebhook = (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        res.status(200).send(challenge);
        return;
    }
    res.sendStatus(403);
};

interface WhatsappIncomingMessage {
    from: string;
    text?: { body: string };
    type: string;
}

export const receiveWhatsappMessage = async (req: Request, res: Response) => {
    // Acknowledge immediately — Meta retries aggressively on anything but 200.
    res.status(200).json({ received: true });

    try {
        const entry = req.body?.entry?.[0];
        const change = entry?.changes?.[0]?.value;
        const phoneNumberId: string | undefined = change?.metadata?.phone_number_id;
        const messages: WhatsappIncomingMessage[] = change?.messages ?? [];

        for (const message of messages) {
            if (message.type !== "text" || !message.text?.body) continue;
            const reply = await handleIncomingChatMessage("whatsapp", message.from, message.text.body);
            if (phoneNumberId) {
                await sendWhatsappMessage(phoneNumberId, message.from, reply);
            }
        }
    } catch (err) {
        console.error("[whatsapp] Failed to process incoming message:", err);
    }
};

const sendWhatsappMessage = async (phoneNumberId: string, to: string, body: string) => {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!token) {
        console.warn("[whatsapp] WHATSAPP_ACCESS_TOKEN not set — cannot send reply.");
        return;
    }
    await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            text: { body },
        }),
    });
};
