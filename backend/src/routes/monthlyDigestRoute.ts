import express from "express";
import { triggerDigestForUser, triggerDigestForAll } from "../controllers/monthlyDigestController";

const router = express.Router();

router.post("/:userId/send", triggerDigestForUser);
router.post("/send-all", triggerDigestForAll);

export default router;
