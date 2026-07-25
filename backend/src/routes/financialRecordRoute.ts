import express from 'express'
import { AddRecords, editRecords, getAllByUserId, deleteRecords, getMonthlySummary } from '../controllers/financialRecordController'
import { requireSelf } from '../middleware/auth'

const financialrecordRouter = express.Router();

financialrecordRouter.get("/getUserById/:userId", requireSelf, getAllByUserId)
financialrecordRouter.get("/summary/:userId", requireSelf, getMonthlySummary)
financialrecordRouter.post("/add", AddRecords)
financialrecordRouter.put("/edit/:id", editRecords)
financialrecordRouter.delete("/delete/:id", deleteRecords)

export default financialrecordRouter