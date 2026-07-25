import mongoose from 'mongoose'

// On Vercel each request may hit a fresh (or a reused, warm) serverless
// instance — reconnecting from scratch every time would be slow and would
// exhaust Atlas's connection limit under load. Caching the connection
// promise at module scope means a warm instance reuses the existing
// connection, while a cold one connects exactly once even under concurrent
// requests (they all await the same in-flight promise).
let connectionPromise: Promise<typeof mongoose> | null = null

export const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose

    if (!connectionPromise) {
        const mongodb = process.env.MONGO_URI
        if (!mongodb) {
            throw new Error("Missing MONGO_URI environment variable")
        }

        connectionPromise = mongoose
            .connect(mongodb)
            .then((m) => {
                console.log("connection successful")
                return m
            })
            .catch((err) => {
                connectionPromise = null
                throw err
            })
    }

    return connectionPromise
}
