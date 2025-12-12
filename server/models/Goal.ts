import mongoose, { Schema, Document } from "mongoose";

export interface IGoal extends Document {
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    color?: string;
    createdAt: Date;
    updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
    {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        targetAmount: { type: Number, required: true },
        currentAmount: { type: Number, default: 0 },
        color: { type: String },
    },
    { timestamps: true }
);

// Index for faster queries by user
GoalSchema.index({ userId: 1 });

export const Goal = mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);
