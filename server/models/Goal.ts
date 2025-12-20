import mongoose, { Schema, Document } from "mongoose";

export interface IGoal extends Document {
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    color?: string;
    status: 'active' | 'fulfilled' | 'archived';
    completedAt?: Date;
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
        status: { type: String, enum: ['active', 'fulfilled', 'archived'], default: 'active' },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

// Index for faster queries by user
GoalSchema.index({ userId: 1 });

// Handle HMR: delete existing model if it exists to ensure new schema is used
if (mongoose.models.Goal) {
    delete mongoose.models.Goal;
}

export const Goal = mongoose.model<IGoal>("Goal", GoalSchema);
