import LinkCodeModel from "../model/linkCodeModel";
import ChatIntegrationModel, { ChatPlatform } from "../model/chatIntegrationModel";
import SubscriptionModel, { isSubscriptionActive } from "../model/subscriptionModel";
import FinancialRecordModel from "../model/financialRecordModel";
import { parseRecordMessage, isParseError } from "./messageParser";
import { CATEGORIES, PAYMENT_METHODS } from "../constants";

export const FORMAT_HINT =
    `Send it like this:\n` +
    `Groceries, 45.50, Food, Cash\n\n` +
    `Category and payment method are optional — leave them off and they'll default to Other and Cash.\n\n` +
    `Categories: ${CATEGORIES.join(", ")}\n` +
    `Payment methods: ${PAYMENT_METHODS.join(", ")}`;

const CONNECT_PATTERN = /^\/?(?:start|connect)\s+([a-z0-9]+)$/i;

// Shared across Telegram, WhatsApp, and Messenger: same linking convention
// ("/start CODE" or "connect CODE"), same subscription gate, same parser,
// same record creation. Each platform's controller only has to translate its
// own webhook payload into (platform, externalId, text) and send the reply
// back through that platform's own API.
export const handleIncomingChatMessage = async (
    platform: ChatPlatform,
    externalId: string,
    text: string
): Promise<string> => {
    const connectMatch = text.trim().match(CONNECT_PATTERN);
    if (connectMatch && connectMatch[1]) {
        return handleConnect(platform, externalId, connectMatch[1]);
    }

    const integration = await ChatIntegrationModel.findOne({ platform, externalId });
    if (!integration) {
        return "This chat isn't connected to a Finance Tracker account yet. Get a linking code from the Automation page, then send \"connect CODE\" here.";
    }

    const subscription = await SubscriptionModel.findOne({ userId: integration.userId });
    if (!subscription || !isSubscriptionActive(subscription.status)) {
        return "Your automation subscription isn't active. Subscribe on the Automation page to keep using this.";
    }

    const parsed = parseRecordMessage(text);
    if (isParseError(parsed)) {
        return `${parsed.error}\n\n${FORMAT_HINT}`;
    }

    await new FinancialRecordModel({
        userId: integration.userId,
        date: new Date(),
        description: parsed.description,
        amount: parsed.amount,
        category: parsed.category,
        paymentMethod: parsed.paymentMethod,
    }).save();

    return `✅ Added: ${parsed.description} — ${parsed.amount} · ${parsed.category} · ${parsed.paymentMethod}`;
};

const handleConnect = async (platform: ChatPlatform, externalId: string, code: string): Promise<string> => {
    const linkCode = await LinkCodeModel.findOne({ code: code.toUpperCase(), platform });
    if (!linkCode || linkCode.expiresAt < new Date()) {
        return "That code is invalid or expired. Generate a new one on the Automation page.";
    }

    // A given chat can only ever belong to one account — if it's already
    // linked to someone else, block it here with a clear reply instead of
    // letting the unique-index violation below throw.
    const existingForThisChat = await ChatIntegrationModel.findOne({ platform, externalId });
    if (existingForThisChat && existingForThisChat.userId !== linkCode.userId) {
        return "This chat is already connected to a different Finance Tracker account. Disconnect it from that account's Automation page first, or use a different chat.";
    }

    await ChatIntegrationModel.findOneAndUpdate(
        { userId: linkCode.userId, platform },
        { userId: linkCode.userId, platform, externalId, connectedAt: new Date() },
        { upsert: true }
    );
    await LinkCodeModel.deleteOne({ _id: linkCode._id });

    return `✅ Connected! You can now add expenses by sending a message here.\n\n${FORMAT_HINT}`;
};
