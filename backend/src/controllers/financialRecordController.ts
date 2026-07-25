import { Request, Response } from 'express'
import FinancialRecordModel from '../model/financialRecordModel'


export const getAllByUserId = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId

        const records = await FinancialRecordModel.find({ userId: userId })
        res.status(200).json({success: true, message:"user found", records})
    } catch (err) {
        res.status(500).json({succes: false, message: 'Failed to fetch financial records' })
    }
}

export const AddRecords = async (req: Request, res: Response) => {
    try {
        const newRecordBody = req.body
        const newRecord = new FinancialRecordModel(newRecordBody)
        const savedRecord = await newRecord.save()

        res.status(200).json({success: true, message:"record added", savedRecord})
    } catch (err) {
        res.status(500).json({succes: false, message: 'Failed to add records' })
    }
}


export const editRecords = async (req: Request, res: Response) => {
    try {
        const id = req.params.id
        const newRecordBody = req.body
        const record = await FinancialRecordModel.findByIdAndUpdate(id, newRecordBody)
        res.status(200).json({success: true, message:"record edit successful", record})
    } catch (err) {
        res.status(500).json({succes: false, message: 'Failed to edit records' })
    }
}

export const deleteRecords = async (req: Request, res: Response) => {
    try {
        const id = req.params.id
        const record = await FinancialRecordModel.findByIdAndDelete(id)
        res.status(200).json({success: true, message:"record deletion succcessful", record})
    } catch (err) {
        res.status(500).json({succes: false, message: 'Failed to delete records' })
    }
}

export const getMonthlySummary = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params
        if (!userId || Array.isArray(userId)) {
            res.status(400).json({ success: false, message: 'userId is required' })
            return
        }
        const summary = await FinancialRecordModel.getMonthlySummary(userId)
        res.status(200).json({ success: true, message: "summary found", ...summary })
    } catch (err) {
        res.status(500).json({ succes: false, message: 'Failed to fetch monthly summary' })
    }
}

