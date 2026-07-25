import "dotenv/config"
import app from './app'
import { connectDB } from './config/db'
import { launchTelegramBotPolling } from './utils/telegramBot'

// Standalone entry point for local development (npm run dev / node build/server.js).
// Production runs through api/index.ts as a Vercel serverless function instead —
// that path never imports this file, so app.listen() and the Telegram poller
// only ever run here, never on Vercel.
const port: number | string = process.env.PORT || 3001

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on port ${port}`)
        })
        launchTelegramBotPolling()
    })
    .catch((err) => console.error("MongoDB connection error:", err))
