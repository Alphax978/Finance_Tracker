import mongoose from "mongoose";

export type ChatPlatform = "telegram" | "whatsapp" | "messenger";

interface ChatIntegration {
    userId: string;
    platform: ChatPlatform;
    externalId: string; // Telegram chat id / WhatsApp phone id / Messenger PSID
    connectedAt: Date;
}

const chatIntegrationSchema = new mongoose.Schema<ChatIntegration>({
    userId: { type: String, required: true },
    platform: { type: String, required: true },
    externalId: { type: String, required: true },
    connectedAt: { type: Date, required: true, default: () => new Date() },
});

// A user can link at most one chat per platform, and a given external chat
// can only ever map back to one account.
chatIntegrationSchema.index({ userId: 1, platform: 1 }, { unique: true });
chatIntegrationSchema.index({ platform: 1, externalId: 1 }, { unique: true });

const ChatIntegrationModel = mongoose.model<ChatIntegration>("ChatIntegration", chatIntegrationSchema);

export default ChatIntegrationModel;
