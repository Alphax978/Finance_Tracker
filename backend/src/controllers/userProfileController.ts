import { Request, Response } from "express";
import UserProfileModel from "../model/userProfileModel";

const getUserId = (req: Request): string | null => {
    const { userId } = req.params;
    if (!userId || Array.isArray(userId)) return null;
    return userId;
};

export const upsertUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { email } = req.body as { email?: string };

        if (!userId) {
            res.status(400).json({ message: "userId is required" });
            return;
        }

        if (!email) {
            res.status(400).json({ message: "email is required" });
            return;
        }

        await UserProfileModel.findOneAndUpdate(
            { userId },
            { userId, email },
            { upsert: true }
        );

        res.status(200).json({ userId, email });
    } catch (error) {
        res.status(500).json({ message: "Error saving user profile", error });
    }
};
