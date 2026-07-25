export const CATEGORIES = ["Food", "Rent", "Utilities", "Entertainment", "Other"] as const;
export const PAYMENT_METHODS = ["Cash", "Credit Card", "Debit Card", "Bank Transfer"] as const;

export type Category = typeof CATEGORIES[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];

const normalize = (value: string) => value.trim().toLowerCase();

export const matchCategory = (input: string): Category | null => {
    const found = CATEGORIES.find((c) => normalize(c) === normalize(input));
    return found ?? null;
};

export const matchPaymentMethod = (input: string): PaymentMethod | null => {
    const found = PAYMENT_METHODS.find((p) => normalize(p) === normalize(input));
    return found ?? null;
};
