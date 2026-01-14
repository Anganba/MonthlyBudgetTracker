import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    username: string;
    email?: string;
    passwordHash: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    createdAt?: Date;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: false, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: false },
    bio: { type: String, required: false, maxlength: 200 },
    avatarUrl: { type: String, required: false },
}, { timestamps: true });

if (mongoose.models.User) {
    delete mongoose.models.User;
}
export const User = mongoose.model<IUser>("User", UserSchema);
