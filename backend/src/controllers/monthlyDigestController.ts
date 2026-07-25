import { Request, Response } from "express";
import { sendMonthlyDigestForUser, runMonthlyDigestForAllUsers } from "../utils/monthlyDigest";

// These are admin/testing tools, not user-facing endpoints — none of them
// are ever called from the frontend, so they're gated by CRON_SECRET rather
// than a per-user Clerk check. triggerDigestForAll in particular sends email
// to every user in the app on demand, which must never be publicly callable.
const isAuthorizedByCronSecret = (req: Request): boolean => {
    const secret = process.env.CRON_SECRET;
    return !secret || req.headers.authorization === `Bearer ${secret}`;
};

// Manual endpoints exist purely so the digest can be tested/re-run without
// waiting for the real cron boundary (the 1st of the month).
export const triggerDigestForUser = async (req: Request, res: Response) => {
    if (!isAuthorizedByCronSecret(req)) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const { userId } = req.params;
        const { email, year, month } = req.body as { email?: string; year?: number; month?: number };

        if (!email) {
            res.status(400).json({ message: "email is required" });
            return;
        }

        const now = new Date();
        const targetYear = year ?? now.getUTCFullYear();
        const targetMonth = month ?? now.getUTCMonth() + 1;

        const result = await sendMonthlyDigestForUser(userId as string, email, targetYear, targetMonth);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Error sending digest", error });
    }
};

export const triggerDigestForAll = async (req: Request, res: Response) => {
    if (!isAuthorizedByCronSecret(req)) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const { year, month } = req.body as { year?: number; month?: number };
        const now = new Date();
        const targetYear = year ?? now.getUTCFullYear();
        const targetMonth = month ?? now.getUTCMonth() + 1;

        const results = await runMonthlyDigestForAllUsers(targetYear, targetMonth);
        res.status(200).json({ results });
    } catch (error) {
        res.status(500).json({ message: "Error sending digests", error });
    }
};

// Hit by Vercel Cron (see vercel.json) on the 1st of every month — there's
// no long-running process to host node-cron on a serverless deployment, so
// the platform's own scheduler calls this HTTP endpoint instead. Vercel
// automatically sends `Authorization: Bearer <CRON_SECRET>` on cron-triggered
// requests, which is what keeps this from being a public "send email to
// everyone" endpoint.
export const triggerDigestCron = async (req: Request, res: Response) => {
    if (!isAuthorizedByCronSecret(req)) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        // Sends the *previous* month's recap, since the month that just
        // ended is the one with a complete record set.
        const now = new Date();
        const prevMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        const year = prevMonthDate.getUTCFullYear();
        const month = prevMonthDate.getUTCMonth() + 1;

        const results = await runMonthlyDigestForAllUsers(year, month);
        res.status(200).json({ year, month, results });
    } catch (error) {
        res.status(500).json({ message: "Error running monthly digest", error });
    }
};
