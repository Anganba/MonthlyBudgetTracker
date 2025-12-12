import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    username: string;
    email?: string;
    passwordHash: string;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: false, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
});

if (mongoose.models.User) {
    delete mongoose.models.User;
}
export const User = mongoose.model<IUser>("User", UserSchema);
