import mongoose, { Schema, Document } from "mongoose";

export interface ICustomCategory {
    id: string;
    label: string;
    type: 'expense' | 'income';
    icon?: string; // Lucide icon name, e.g. "Shirt", "Car"
}

export interface IUser extends Document {
    username: string;
    email?: string;
    passwordHash: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    customCategories?: ICustomCategory[];
    createdAt?: Date;
}

const CustomCategorySchema = new Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['expense', 'income'], required: true },
    icon: { type: String, required: false },
}, { _id: false });

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: false, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: false },
    bio: { type: String, required: false, maxlength: 200 },
    avatarUrl: { type: String, required: false },
    customCategories: { type: [CustomCategorySchema], default: [] },
}, { timestamps: true });

if (mongoose.models.User) {
    delete mongoose.models.User;
}
export const User = mongoose.model<IUser>("User", UserSchema);
