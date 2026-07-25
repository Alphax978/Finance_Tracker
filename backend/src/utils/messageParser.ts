import { CATEGORIES, PAYMENT_METHODS, matchCategory, matchPaymentMethod, Category, PaymentMethod } from "../constants";

export interface ParsedRecord {
    description: string;
    amount: number;
    category: Category;
    paymentMethod: PaymentMethod;
}

export interface ParseError {
    error: string;
}

const DEFAULT_CATEGORY: Category = "Other";
const DEFAULT_PAYMENT_METHOD: PaymentMethod = "Cash";

export const isParseError = (result: ParsedRecord | ParseError): result is ParseError => "error" in result;

// categoryRaw/paymentRaw are optional — leaving them out defaults to
// "Other" / "Cash" rather than failing. If a value IS given, though, it
// still has to match a real category/payment method (typos aren't silently
// swallowed into a default).
const buildRecord = (
    description: string,
    amountRaw: string,
    categoryRaw?: string,
    paymentRaw?: string
): ParsedRecord | ParseError => {
    const trimmedDescription = description.trim();
    if (!trimmedDescription) return { error: "Missing a description." };

    const amount = Number(amountRaw);
    if (!amountRaw || Number.isNaN(amount) || amount <= 0) {
        return { error: `"${amountRaw}" isn't a valid amount — it needs to be a positive number.` };
    }

    let category: Category = DEFAULT_CATEGORY;
    if (categoryRaw) {
        const matched = matchCategory(categoryRaw);
        if (!matched) {
            return { error: `Didn't recognize category "${categoryRaw}". Use one of: ${CATEGORIES.join(", ")}.` };
        }
        category = matched;
    }

    let paymentMethod: PaymentMethod = DEFAULT_PAYMENT_METHOD;
    if (paymentRaw) {
        const matched = matchPaymentMethod(paymentRaw);
        if (!matched) {
            return { error: `Didn't recognize payment method "${paymentRaw}". Use one of: ${PAYMENT_METHODS.join(", ")}.` };
        }
        paymentMethod = matched;
    }

    return { description: trimmedDescription, amount, category, paymentMethod };
};

// Accepts either a reliable comma-delimited format —
//   "Groceries, 45.50, Food, Cash"
// — where category and/or payment method can simply be left off (they
// default to Other / Cash) — or a best-effort space-separated fallback that
// looks for a trailing payment method and category from the end, defaulting
// whichever one it can't find, with everything left over treated as the
// description.
export const parseRecordMessage = (raw: string): ParsedRecord | ParseError => {
    const text = raw.trim();
    if (!text) return { error: "Message was empty." };

    if (text.includes(",")) {
        // Not filtered — an empty field (e.g. a skipped category between two
        // commas) has to keep its position so it doesn't shift later fields
        // into the wrong slot.
        const parts = text.split(",").map((p) => p.trim());
        if (parts.length < 2 || !parts[0] || !parts[1]) {
            return { error: "Need at least a description and an amount, e.g. \"Groceries, 45.50\"." };
        }
        const [description, amountRaw, categoryRaw, paymentRaw] = parts;
        return buildRecord(description ?? "", amountRaw ?? "", categoryRaw || undefined, paymentRaw || undefined);
    }

    const tokens = text.split(/\s+/);
    if (tokens.length < 2) {
        return { error: "Need at least a description and an amount, e.g. \"Groceries 45.50\"." };
    }

    // Payment method first, from the very end (checking a possible two-word
    // match like "Credit Card" before a one-word one).
    let remaining = tokens;
    let paymentRaw: string | undefined;
    const lastTwoWords = tokens.slice(-2).join(" ");
    const lastWord = tokens.slice(-1).join(" ");
    if (tokens.length > 2 && matchPaymentMethod(lastTwoWords)) {
        paymentRaw = lastTwoWords;
        remaining = tokens.slice(0, -2);
    } else if (matchPaymentMethod(lastWord)) {
        paymentRaw = lastWord;
        remaining = tokens.slice(0, -1);
    }

    // Then category, from whatever's left.
    let categoryRaw: string | undefined;
    const newLastWord = remaining[remaining.length - 1];
    if (remaining.length > 2 && newLastWord && matchCategory(newLastWord)) {
        categoryRaw = newLastWord;
        remaining = remaining.slice(0, -1);
    }

    if (remaining.length < 2) {
        return { error: "Need at least a description and an amount, e.g. \"Groceries 45.50\"." };
    }

    const amountRaw = remaining[remaining.length - 1] ?? "";
    const description = remaining.slice(0, -1).join(" ");

    return buildRecord(description, amountRaw, categoryRaw, paymentRaw);
};
