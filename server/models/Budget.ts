import mongoose, { Schema, Document } from "mongoose";
import { Transaction, TransactionCategory } from "@shared/api";

export interface IBudget extends Document {
    month: string;
    year: number;
    rolloverPlanned: number;
    rolloverActual: number;
    categoryLimits?: Map<string, number>;
    transactions: Transaction[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<Transaction>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['expense', 'income', 'transfer', 'savings'], default: 'expense' },
    planned: { type: Number, required: true },
    actual: { type: Number, required: true },
    category: {
        type: String,
        required: true,
    },
    date: { type: String, required: true },
    goalId: { type: String, required: false },
    walletId: { type: String, required: false }, // Link to Wallet (Source)
    toWalletId: { type: String, required: false }, // Link to Target Wallet (Transfer)
});

const BudgetSchema = new Schema<IBudget>(
    {
        month: { type: String, required: true },
        year: { type: Number, required: true },
        rolloverPlanned: { type: Number, default: 0 },
        rolloverActual: { type: Number, default: 0 },
        categoryLimits: { type: Map, of: Number, default: {} },
        transactions: [TransactionSchema],
        userId: { type: String, required: true },
    },
    { timestamps: true, toJSON: { flattenMaps: true } }
);

// Compound index to ensure unique budget per month/year per user
BudgetSchema.index({ month: 1, year: 1, userId: 1 }, { unique: true });

if (mongoose.models.Budget) {
    delete mongoose.models.Budget;
}

export const Budget = mongoose.model<IBudget>("Budget", BudgetSchema);
