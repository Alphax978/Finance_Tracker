import mongoose from "mongoose";
import { ChatPlatform } from "./chatIntegrationModel";

interface LinkCode {
    userId: string;
    platform: ChatPlatform;
    code: string;
    expiresAt: Date;
}

const linkCodeSchema = new mongoose.Schema<LinkCode>({
    userId: { type: String, required: true },
    platform: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
});

// MongoDB TTL index — codes are single-purpose and expire on their own,
// no manual cleanup job needed.
linkCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const LinkCodeModel = mongoose.model<LinkCode>("LinkCode", linkCodeSchema);

export default LinkCodeModel;
