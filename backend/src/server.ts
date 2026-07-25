import express, {Express} from 'express'
import "dotenv/config"
import cron from 'node-cron'
import { connectDB } from './config/db'
import financialrecordRouter from './routes/financialRecordRoute'
import savingsGoalRouter from './routes/savingsGoalRoute'
import subscriptionRouter from './routes/subscriptionRoute'
import automationRouter from './routes/automationRoute'
import whatsappRouter from './routes/whatsappRoute'
import messengerRouter from './routes/messengerRoute'
import userProfileRouter from './routes/userProfileRoute'
import monthlyDigestRouter from './routes/monthlyDigestRoute'
import { handleStripeWebhook } from './controllers/subscriptionController'
import { launchTelegramBot } from './utils/telegramBot'
import { runMonthlyDigestForAllUsers } from './utils/monthlyDigest'
import cors from 'cors'

const app: Express = express()
const port: number | string = process.env.PORT || 3001



connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`)
    })
    launchTelegramBot()

    // 9am UTC on the 1st of every month — sends the *previous* month's
    // recap, since the month that just ended is the one with a complete
    // record set.
    cron.schedule("0 9 1 * *", () => {
        const now = new Date()
        const prevMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
        const year = prevMonthDate.getUTCFullYear()
        const month = prevMonthDate.getUTCMonth() + 1
        runMonthlyDigestForAllUsers(year, month).catch((err) =>
            console.error("[monthlyDigest] Scheduled run failed:", err)
        )
    })
})
.catch((err) => console.error("MongoDB connection error:", err))

app.use(cors())

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
app.use("/api/userprofile", userProfileRouter)
app.use("/api/monthlydigest", monthlyDigestRouter)
