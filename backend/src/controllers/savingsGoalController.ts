import { Request, Response } from 'express'
import SavingsGoalModel from '../model/savingsGoalModel'
import FinancialRecordModel from '../model/financialRecordModel'
import { sendEmail } from '../utils/mailer'
import { spendingAlertEmail } from '../utils/emailTemplates'

const getUserId = (req: Request): string | null => {
    const { userId } = req.params
    if (!userId || Array.isArray(userId)) return null
    return userId
}

export const getSavingsGoal = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req)
        if (!userId) {
            res.status(400).json({ success: false, message: 'userId is required' })
            return
        }

        const goal = await SavingsGoalModel.findOne({ userId })
        res.status(200).json({ success: true, goal })
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch savings goal' })
    }
}

export const upsertSavingsGoal = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req)
        if (!userId) {
            res.status(400).json({ success: false, message: 'userId is required' })
            return
        }

        const { email, monthlySalary, alertsEnabled } = req.body

        // findOneAndUpdate bypasses Mongoose virtual setters, and monthlySalary
        // only exists as a virtual (it encrypts itself into monthlySalaryEncrypted
        // on assignment) — so this has to go through a real document + save().
        let goal = await SavingsGoalModel.findOne({ userId })
        if (!goal) {
            goal = new SavingsGoalModel({ userId })
        }
        goal.email = email
        goal.monthlySalary = monthlySalary
        goal.alertsEnabled = alertsEnabled ?? true
        await goal.save()

        res.status(200).json({ success: true, goal })
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to save savings goal' })
    }
}

export const deleteSavingsGoal = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req)
        if (!userId) {
            res.status(400).json({ success: false, message: 'userId is required' })
            return
        }

        await SavingsGoalModel.findOneAndDelete({ userId })
        res.status(200).json({ success: true })
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete savings goal' })
    }
}

export const getSavingsProgress = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req)
        if (!userId) {
            res.status(400).json({ success: false, message: 'userId is required' })
            return
        }

        const goal = await SavingsGoalModel.findOne({ userId })
        if (!goal) {
            res.status(200).json({ success: true, goal: null })
            return
        }

        // UTC explicitly — the server's local system timezone must never affect
        // month bucketing for a global user base (it's an implementation detail
        // of wherever this process happens to be deployed, not a real signal).
        const now = new Date()
        const year = now.getUTCFullYear()
        const month = now.getUTCMonth() + 1

        const [spentResult] = await FinancialRecordModel.aggregate([
            {
                $match: {
                    userId,
                    $expr: {
                        $and: [
                            { $eq: [{ $year: '$date' }, year] },
                            { $eq: [{ $month: '$date' }, month] },
                        ],
                    },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ])

        const spent = spentResult?.total ?? 0
        const percentSpent = goal.monthlySalary > 0 ? (spent / goal.monthlySalary) * 100 : 0

        let emailSent = false
        let goalChanged = false
        const newlyNotified: number[] = []

        // Edge-triggered: only the false -> true transition sends an email.
        // Dropping back below (e.g. a record was deleted) silently clears the
        // flag with no email, so a genuine re-crossing later notifies again.
        const isAbove30 = percentSpent >= 30
        if (isAbove30 !== goal.isAbove30) {
            goal.isAbove30 = isAbove30
            goalChanged = true
            if (isAbove30 && goal.alertsEnabled) {
                emailSent = await sendEmail(
                    goal.email,
                    `You've spent ${percentSpent.toFixed(0)}% of this month's salary`,
                    spendingAlertEmail({
                        percent: percentSpent,
                        spent,
                        salary: goal.monthlySalary,
                        accentColor: "#2563eb",
                        message: "Just a heads up — keep an eye on your spending as the month goes on.",
                    })
                ) || emailSent
                newlyNotified.push(30)
            }
        }

        const isAbove50 = percentSpent >= 50
        if (isAbove50 !== goal.isAbove50) {
            goal.isAbove50 = isAbove50
            goalChanged = true
            if (isAbove50 && goal.alertsEnabled) {
                emailSent = await sendEmail(
                    goal.email,
                    `You've spent ${percentSpent.toFixed(0)}% of this month's salary`,
                    spendingAlertEmail({
                        percent: percentSpent,
                        spent,
                        salary: goal.monthlySalary,
                        accentColor: "#dc2626",
                        message: "Might be worth slowing down on spending for the rest of the month.",
                    })
                ) || emailSent
                newlyNotified.push(50)
            }
        }

        if (goalChanged) {
            await goal.save()
        }

        res.status(200).json({
            success: true,
            goal,
            spent,
            percentSpent,
            emailSent,
            newlyNotified,
        })
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to compute savings progress' })
    }
}
