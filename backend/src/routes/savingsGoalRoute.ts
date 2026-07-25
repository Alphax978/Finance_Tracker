import express from 'express'
import { getSavingsGoal, upsertSavingsGoal, deleteSavingsGoal, getSavingsProgress } from '../controllers/savingsGoalController'

const savingsGoalRouter = express.Router();

savingsGoalRouter.get("/:userId", getSavingsGoal)
savingsGoalRouter.get("/:userId/progress", getSavingsProgress)
savingsGoalRouter.put("/:userId", upsertSavingsGoal)
savingsGoalRouter.delete("/:userId", deleteSavingsGoal)

export default savingsGoalRouter
