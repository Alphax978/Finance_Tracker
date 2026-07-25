import mongoose from "mongoose";

interface FinancialRecord {
    userId: string;
    date: Date;
    description: string,
    amount: number,
    category: string,
    paymentMethod: string
}

interface MonthlyTotal {
    year: number;
    month: number;
    total: number;
}

interface YearlyTotal {
    year: number;
    total: number;
}

interface MonthlySummary {
    monthly: MonthlyTotal[];
    yearly: YearlyTotal[];
}

interface FinancialRecordModelType extends mongoose.Model<FinancialRecord> {
    getMonthlySummary(userId: string): Promise<MonthlySummary>;
}

const financialRecordSchema = new mongoose.Schema<FinancialRecord, FinancialRecordModelType>({
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    paymentMethod: { type: String, required: true },
});

financialRecordSchema.statics.getMonthlySummary = async function (userId: string) {
    const [summary] = await this.aggregate([
        { $match: { userId } },
        {
            $facet: {
                monthly: [
                    {
                        $group: {
                            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
                            total: { $sum: "$amount" },
                        },
                    },
                    { $sort: { "_id.year": -1, "_id.month": -1 } },
                    { $project: { _id: 0, year: "$_id.year", month: "$_id.month", total: 1 } },
                ],
                yearly: [
                    { $group: { _id: { $year: "$date" }, total: { $sum: "$amount" } } },
                    { $sort: { _id: -1 } },
                    { $project: { _id: 0, year: "$_id", total: 1 } },
                ],
            },
        },
    ]);

    return {
        monthly: summary?.monthly ?? [],
        yearly: summary?.yearly ?? [],
    };
};

const FinancialRecordModel = mongoose.model<FinancialRecord, FinancialRecordModelType>(
    "FinancialRecord",
    financialRecordSchema
);

export default FinancialRecordModel;
