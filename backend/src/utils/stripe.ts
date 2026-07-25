import Stripe from "stripe";

let client: Stripe | null = null;

export const getStripeClient = (): Stripe | null => {
    if (client) return client;
    const { STRIPE_SECRET_KEY } = process.env;
    if (!STRIPE_SECRET_KEY) return null;
    client = new Stripe(STRIPE_SECRET_KEY);
    return client;
};
