import { Request, Response } from "express";
import Stripe from "stripe";
import SubscriptionModel, { SubscriptionStatus, isSubscriptionActive } from "../model/subscriptionModel";
import { getStripeClient } from "../utils/stripe";

const getUserId = (req: Request): string | null => {
    const { userId } = req.params;
    if (!userId || Array.isArray(userId)) return null;
    return userId;
};

const periodEndFromSubscription = (subscription: Stripe.Subscription): Date => {
    const seconds = subscription.items.data[0]?.current_period_end;
    return seconds ? new Date(seconds * 1000) : new Date();
};

export const getSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(400).json({ success: false, message: "userId is required" });
            return;
        }

        const subscription = await SubscriptionModel.findOne({ userId });
        const active = subscription ? isSubscriptionActive(subscription.status) : false;
        res.status(200).json({ success: true, subscription, isActive: active });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch subscription" });
    }
};

export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(400).json({ success: false, message: "userId is required" });
            return;
        }

        const stripe = getStripeClient();
        const priceId = process.env.STRIPE_PRICE_ID;
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        if (!stripe || !priceId) {
            res.status(503).json({ success: false, message: "Billing is not configured yet" });
            return;
        }

        const { email } = req.body;
        const existing = await SubscriptionModel.findOne({ userId });

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            client_reference_id: userId,
            success_url: `${frontendUrl}/automation?checkout=success`,
            cancel_url: `${frontendUrl}/automation?checkout=cancelled`,
            metadata: { userId },
            ...(existing?.stripeCustomerId
                ? { customer: existing.stripeCustomerId }
                : { customer_email: email }),
        });

        res.status(200).json({ success: true, url: session.url });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to start checkout" });
    }
};

export const createPortalSession = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(400).json({ success: false, message: "userId is required" });
            return;
        }

        const stripe = getStripeClient();
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        if (!stripe) {
            res.status(503).json({ success: false, message: "Billing is not configured yet" });
            return;
        }

        const subscription = await SubscriptionModel.findOne({ userId });
        if (!subscription) {
            res.status(404).json({ success: false, message: "No subscription found" });
            return;
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${frontendUrl}/automation`,
        });

        res.status(200).json({ success: true, url: portalSession.url });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to open billing portal" });
    }
};

// Stripe requires the raw request body for signature verification — this
// route is mounted with express.raw() instead of express.json() in server.ts.
export const handleStripeWebhook = async (req: Request, res: Response) => {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !webhookSecret) {
        res.status(503).send("Webhook not configured");
        return;
    }

    const signature = req.headers["stripe-signature"];
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature as string, webhookSecret);
    } catch (err) {
        res.status(400).send(`Webhook signature verification failed`);
        return;
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id || (session.metadata?.userId ?? null);
                if (userId && session.subscription && session.customer) {
                    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                    await SubscriptionModel.findOneAndUpdate(
                        { userId },
                        {
                            userId,
                            email: session.customer_details?.email ?? "",
                            stripeCustomerId: session.customer as string,
                            stripeSubscriptionId: subscription.id,
                            status: subscription.status as SubscriptionStatus,
                            currentPeriodEnd: periodEndFromSubscription(subscription),
                        },
                        { upsert: true }
                    );
                }
                break;
            }
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                await SubscriptionModel.findOneAndUpdate(
                    { stripeSubscriptionId: subscription.id },
                    {
                        status: subscription.status as SubscriptionStatus,
                        currentPeriodEnd: periodEndFromSubscription(subscription),
                    }
                );
                break;
            }
            default:
                break;
        }
        res.status(200).json({ received: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to process webhook" });
    }
};
