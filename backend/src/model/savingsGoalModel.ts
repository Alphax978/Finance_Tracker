import mongoose from "mongoose";
import { encryptNumber, decryptNumber } from "../utils/encryption";

// monthlySalary is never a real schema path — only monthlySalaryEncrypted is
// persisted. The virtual below transparently encrypts on write and decrypts
// on read, so the rest of the app can keep treating it as a plain number.
interface SavingsGoal {
    userId: string;
    email: string;
    monthlySalaryEncrypted: string;
    alertsEnabled: boolean;
    isAbove30: boolean;
    isAbove50: boolean;
    monthlySalary: number;
}

const savingsGoalSchema = new mongoose.Schema<SavingsGoal>({
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    monthlySalaryEncrypted: { type: String, required: true },
    alertsEnabled: { type: Boolean, required: true, default: true },
    isAbove30: { type: Boolean, required: true, default: false },
    isAbove50: { type: Boolean, required: true, default: false },
});

savingsGoalSchema.virtual("monthlySalary")
    .get(function (this: SavingsGoal) {
        return this.monthlySalaryEncrypted ? decryptNumber(this.monthlySalaryEncrypted) : 0
    })
    .set(function (this: SavingsGoal, value: number) {
        this.monthlySalaryEncrypted = encryptNumber(value)
    })

// Ciphertext never leaves the server — strip it from anything sent to the client.
savingsGoalSchema.set("toJSON", {
    virtuals: true,
    transform: (_doc, ret) => {
        delete (ret as unknown as Record<string, unknown>).monthlySalaryEncrypted
        return ret
    },
})

const SavingsGoalModel = mongoose.model<SavingsGoal>("SavingsGoal", savingsGoalSchema);

export default SavingsGoalModel;
