import express from 'express'
import { AddRecords, editRecords, getAllByUserId, deleteRecords, getMonthlySummary } from '../controllers/financialRecordController'

const financialrecordRouter = express.Router();

financialrecordRouter.get("/getUserById/:userId", getAllByUserId)
financialrecordRouter.get("/summary/:userId", getMonthlySummary)
financialrecordRouter.post("/add", AddRecords)
financialrecordRouter.put("/edit/:id", editRecords)
financialrecordRouter.delete("/delete/:id", deleteRecords)

export default financialrecordRouter