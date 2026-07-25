import { Request, Response } from "express";
import { handleIncomingChatMessage } from "../utils/chatAutomation";

// --- Meta webhook verification (Messenger Platform) ------------------------
// Same verification handshake as WhatsApp since both run on Meta's Graph API.
// Requires a Facebook Page + Messenger Platform app review before Meta will
// deliver real traffic here — this endpoint is correct but inert until then.
export const verifyMessengerWebhook = (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.MESSENGER_VERIFY_TOKEN) {
        res.status(200).send(challenge);
        return;
    }
    res.sendStatus(403);
};

interface MessengerEvent {
    sender: { id: string };
    message?: { text?: string };
}

export const receiveMessengerMessage = async (req: Request, res: Response) => {
    // Acknowledge immediately — Meta retries aggressively on anything but 200.
    res.status(200).json({ received: true });

    try {
        const entries = req.body?.entry ?? [];
        for (const entry of entries) {
            const events: MessengerEvent[] = entry?.messaging ?? [];
            for (const event of events) {
                const text = event.message?.text;
                const senderId = event.sender?.id;
                if (!text || !senderId) continue;
                const reply = await handleIncomingChatMessage("messenger", senderId, text);
                await sendMessengerMessage(senderId, reply);
            }
        }
    } catch (err) {
        console.error("[messenger] Failed to process incoming message:", err);
    }
};

const sendMessengerMessage = async (recipientId: string, text: string) => {
    const token = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
    if (!token) {
        console.warn("[messenger] MESSENGER_PAGE_ACCESS_TOKEN not set — cannot send reply.");
        return;
    }
    await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text },
        }),
    });
};
