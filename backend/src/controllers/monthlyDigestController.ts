import { Request, Response } from "express";
import { sendMonthlyDigestForUser, runMonthlyDigestForAllUsers } from "../utils/monthlyDigest";

// Manual endpoints exist purely so the digest can be tested/re-run without
// waiting for the real cron boundary (the 1st of the month).
export const triggerDigestForUser = async (req: Request, res: Response) => {
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
