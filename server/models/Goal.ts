import mongoose, { Schema, Document } from "mongoose";

export interface IGoal extends Document {
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: Date;
    category?: string; // Now accepts any category string (uses EXPENSE_CATEGORIES)
    description?: string;
    color?: string;
    status: 'active' | 'fulfilled' | 'archived';
    completedAt?: Date;
    startedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
    {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        targetAmount: { type: Number, required: true },
        currentAmount: { type: Number, default: 0 },
        targetDate: { type: Date },
        category: { type: String }, // Removed enum - now accepts any category from EXPENSE_CATEGORIES
        description: { type: String },
        color: { type: String },
        status: { type: String, enum: ['active', 'fulfilled', 'archived'], default: 'active' },
        completedAt: { type: Date },
        startedAt: { type: Date },
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
