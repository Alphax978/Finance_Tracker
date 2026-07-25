import mongoose from 'mongoose'

export const connectDB = async () => {
    const mongodb = process.env.MONGO_URI

    if (!mongodb) {
        throw new Error("Missing MONGO_URI environment variable")
    }

    await mongoose.connect(mongodb)
    console.log("connection successful")
}
