import mongoose from "mongoose";

export type SubscriptionStatus =
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "unpaid";

interface Subscription {
    userId: string;
    email: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    status: SubscriptionStatus;
    currentPeriodEnd: Date;
}

const subscriptionSchema = new mongoose.Schema<Subscription>({
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    status: { type: String, required: true },
    currentPeriodEnd: { type: Date, required: true },
});

// Active/trialing are the only statuses that unlock the automation feature.
export const isSubscriptionActive = (status: SubscriptionStatus) =>
    status === "active" || status === "trialing";

const SubscriptionModel = mongoose.model<Subscription>("Subscription", subscriptionSchema);

export default SubscriptionModel;
