import express from "express";
import { triggerDigestForUser, triggerDigestForAll, triggerDigestCron } from "../controllers/monthlyDigestController";

const router = express.Router();

router.post("/:userId/send", triggerDigestForUser);
router.post("/send-all", triggerDigestForAll);
router.get("/cron", triggerDigestCron);

export default router;
