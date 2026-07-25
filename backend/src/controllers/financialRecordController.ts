import { Request, Response } from 'express'
import FinancialRecordModel from '../model/financialRecordModel'
import { getAuthUserId } from '../middleware/auth'

const getUserId = (req: Request): string | null => {
    const { userId } = req.params
    if (!userId || Array.isArray(userId)) return null
    return userId
}

export const getAllByUserId = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req)
        if (!userId) {
            res.status(400).json({ success: false, message: 'userId is required' })
            return
        }

        const records = await FinancialRecordModel.find({ userId })
        res.status(200).json({success: true, message:"user found", records})
    } catch (err) {
        res.status(500).json({succes: false, message: 'Failed to fetch financial records' })
    }
}

export const AddRecords = async (req: Request, res: Response) => {
    try {
        const authUserId = getAuthUserId(req)
        const { userId, date, description, amount, category, paymentMethod } = req.body

        if (!authUserId || authUserId !== userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' })
            return
        }

        const newRecord = new FinancialRecordModel({ userId, date, description, amount, category, paymentMethod })
        const savedRecord = await newRecord.save()

        res.status(200).json({success: true, message:"record added", savedRecord})
    } catch (err) {
        res.status(500).json({succes: false, message: 'Failed to add records' })
    }
}


export const editRecords = async (req: Request, res: Response) => {
    try {
        const authUserId = getAuthUserId(req)
        if (!authUserId) {
            res.status(401).json({ success: false, message: 'Unauthorized' })
            return
        }

        // Ownership has to be checked against the record actually stored under
        // this id — the id alone doesn't say who it belongs to, and the request
        // body can't be trusted to say so either.
        const id = req.params.id
        const existing = await FinancialRecordModel.findById(id)
        if (!existing || existing.userId !== authUserId) {
            res.status(404).json({ success: false, message: 'Record not found' })
            return
        }

        const { date, description, amount, category, paymentMethod } = req.body
        const record = await FinancialRecordModel.findByIdAndUpdate(
            id,
            { date, description, amount, category, paymentMethod },
            { new: true }
        )
        res.status(200).json({success: true, message:"record edit successful", record})
    } catch (err) {
        res.status(500).json({succes: false, message: 'Failed to edit records' })
    }
}

export const deleteRecords = async (req: Request, res: Response) => {
    try {
        const authUserId = getAuthUserId(req)
        if (!authUserId) {
            res.status(401).json({ success: false, message: 'Unauthorized' })
            return
        }

        const id = req.params.id
        const existing = await FinancialRecordModel.findById(id)
        if (!existing || existing.userId !== authUserId) {
            res.status(404).json({ success: false, message: 'Record not found' })
            return
        }

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

