import FinancialRecordModel from "../model/financialRecordModel";
import UserProfileModel from "../model/userProfileModel";
import { sendEmail } from "./mailer";
import { monthlyDigestEmail } from "./emailTemplates";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

interface DigestResult {
    userId: string;
    email: string;
    sent: boolean;
    recordCount: number;
}

export const sendMonthlyDigestForUser = async (
    userId: string,
    email: string,
    year: number,
    month: number // 1-12
): Promise<DigestResult> => {
    const records = await FinancialRecordModel.find({
        userId,
        $expr: {
            $and: [
                { $eq: [{ $year: "$date" }, year] },
                { $eq: [{ $month: "$date" }, month] },
            ],
        },
    }).sort({ date: 1 });

    if (records.length === 0) {
        return { userId, email, sent: false, recordCount: 0 };
    }

    const total = records.reduce((sum, r) => sum + r.amount, 0);
    const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

    const sent = await sendEmail(
        email,
        `Your ${monthLabel} recap`,
        monthlyDigestEmail({
            monthLabel,
            total,
            records: records.map((r) => ({
                date: r.date,
                description: r.description,
                category: r.category,
                paymentMethod: r.paymentMethod,
                amount: r.amount,
            })),
        })
    );

    return { userId, email, sent, recordCount: records.length };
};

export const runMonthlyDigestForAllUsers = async (year: number, month: number) => {
    const profiles = await UserProfileModel.find();
    const results: DigestResult[] = [];

    for (const profile of profiles) {
        const result = await sendMonthlyDigestForUser(profile.userId, profile.email, year, month);
        results.push(result);
    }

    const sentCount = results.filter((r) => r.sent).length;
    console.log(
        `[monthlyDigest] Ran for ${year}-${String(month).padStart(2, "0")}: ${sentCount} sent, ${results.length - sentCount} skipped (no records) out of ${profiles.length} profiles.`
    );

    return results;
};
