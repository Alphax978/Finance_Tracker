import express from "express";
import { upsertUserProfile } from "../controllers/userProfileController";
import { requireSelf } from "../middleware/auth";

const router = express.Router();

router.put("/:userId", requireSelf, upsertUserProfile);

export default router;
