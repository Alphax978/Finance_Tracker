import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export const getAuthUserId = (req: Request): string | null => {
    const { userId } = getAuth(req);
    return userId ?? null;
};

// Every route that exposes a :userId param must own its own data — without
// this, anyone could swap the userId in the URL and read or modify someone
// else's records, salary, or subscription. Verifies the Clerk session on the
// request actually belongs to the userId being requested, not just that
// *some* session exists.
export const requireSelf = (req: Request, res: Response, next: NextFunction) => {
    const authUserId = getAuthUserId(req);
    const { userId } = req.params;

    if (!authUserId || !userId || authUserId !== userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }

    next();
};
