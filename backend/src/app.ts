import express, { Express, NextFunction, Request, Response } from 'express'
import "dotenv/config"
import cors from 'cors'
import { connectDB } from './config/db'
import financialrecordRouter from './routes/financialRecordRoute'
import savingsGoalRouter from './routes/savingsGoalRoute'
import subscriptionRouter from './routes/subscriptionRoute'
import automationRouter from './routes/automationRoute'
import whatsappRouter from './routes/whatsappRoute'
import messengerRouter from './routes/messengerRoute'
import telegramRouter from './routes/telegramRoute'
import userProfileRouter from './routes/userProfileRoute'
import monthlyDigestRouter from './routes/monthlyDigestRoute'
import { handleStripeWebhook } from './controllers/subscriptionController'

const app: Express = express()

app.use(cors())

// Every request needs a live DB connection before it can do anything useful —
// on a long-running process (local dev) this resolves instantly after the
// first call; on Vercel it's what makes a cold serverless invocation connect
// before touching any model.
app.use(async (_req: Request, res: Response, next: NextFunction) => {
    try {
        await connectDB()
        next()
    } catch (err) {
        console.error("MongoDB connection error:", err)
        res.status(503).json({ success: false, message: "Database unavailable" })
    }
})

// Stripe needs the raw, unparsed body to verify the webhook signature, so
// this has to be registered before the global JSON parser below.
app.post("/api/subscription/webhook", express.raw({ type: "application/json" }), handleStripeWebhook)

app.use(express.json())
app.use("/api/financialrecord", financialrecordRouter)
app.use("/api/savingsgoal", savingsGoalRouter)
app.use("/api/subscription", subscriptionRouter)
app.use("/api/automation", automationRouter)
app.use("/api/whatsapp", whatsappRouter)
app.use("/api/messenger", messengerRouter)
app.use("/api/telegram", telegramRouter)
app.use("/api/userprofile", userProfileRouter)
app.use("/api/monthlydigest", monthlyDigestRouter)

export default app
