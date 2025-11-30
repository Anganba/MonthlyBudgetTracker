import mongoose, { Schema, Document } from "mongoose";
import { Transaction, TransactionCategory } from "@shared/api";

export interface IBudget extends Document {
    month: string;
    year: number;
    rolloverPlanned: number;
    rolloverActual: number;
    transactions: Transaction[];
    userId?: string; // Optional for now, for future multi-user support
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<Transaction>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    planned: { type: Number, required: true },
    actual: { type: Number, required: true },
    category: {
        type: String,
        required: true,
        enum: ["income", "expenses", "bills", "savings", "debt"]
    },
});

const BudgetSchema = new Schema<IBudget>(
    {
        month: { type: String, required: true },
        year: { type: Number, required: true },
        rolloverPlanned: { type: Number, default: 0 },
        rolloverActual: { type: Number, default: 0 },
        transactions: [TransactionSchema],
        userId: { type: String },
    },
    { timestamps: true }
);

// Compound index to ensure unique budget per month/year per user
BudgetSchema.index({ month: 1, year: 1, userId: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>("Budget", BudgetSchema);
