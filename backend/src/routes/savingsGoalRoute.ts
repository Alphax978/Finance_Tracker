import express from 'express'
import { getSavingsGoal, upsertSavingsGoal, deleteSavingsGoal, getSavingsProgress } from '../controllers/savingsGoalController'
import { requireSelf } from '../middleware/auth'

const savingsGoalRouter = express.Router();

savingsGoalRouter.get("/:userId", requireSelf, getSavingsGoal)
savingsGoalRouter.get("/:userId/progress", requireSelf, getSavingsProgress)
savingsGoalRouter.put("/:userId", requireSelf, upsertSavingsGoal)
savingsGoalRouter.delete("/:userId", requireSelf, deleteSavingsGoal)

export default savingsGoalRouter
