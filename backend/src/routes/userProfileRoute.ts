import express from "express";
import { upsertUserProfile } from "../controllers/userProfileController";

const router = express.Router();

router.put("/:userId", upsertUserProfile);

export default router;
