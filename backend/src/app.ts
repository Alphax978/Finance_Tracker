import express, { Express, NextFunction, Request, Response } from 'express'
import "dotenv/config"
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
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

// Reads the session token from the Authorization header (the frontend attaches
// it via its own axios interceptor) and makes it available to every route
// below via getAuth(req) — doesn't block anything by itself, routes decide
// whether/how to require it.
app.use(clerkMiddleware())

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

// Must be registered last (4-arg signature is how Express identifies an
// error handler). Without this, an error thrown outside a controller's own
// try/catch — e.g. clerkMiddleware rejecting a malformed Authorization
// header — falls through to Express's default handler, which leaks a full
// stack trace (file paths, library internals) as an HTML response.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err)
    if (res.headersSent) return
    res.status(401).json({ success: false, message: "Unauthorized" })
})

export default app
