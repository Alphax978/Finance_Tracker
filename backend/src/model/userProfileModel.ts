import mongoose from "mongoose";

// Records that have a userId but not necessarily an email, and SavingsGoal
// only exists for users who've set up a salary — this is the one place
// every user's email is guaranteed to be on file, needed for the monthly
// digest (and any future account-wide email) to reach everyone, not just
// people who've configured an alert.
interface UserProfile {
    userId: string;
    email: string;
}

const userProfileSchema = new mongoose.Schema<UserProfile>({
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
});

const UserProfileModel = mongoose.model<UserProfile>("UserProfile", userProfileSchema);

export default UserProfileModel;
