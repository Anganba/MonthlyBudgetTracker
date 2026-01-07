import mongoose, { Schema, Document } from "mongoose";
import { RecurringTransaction } from "@shared/api";

export interface IRecurringTransaction extends Document, Omit<RecurringTransaction, 'id'> { }

const RecurringTransactionSchema = new Schema<IRecurringTransaction>(
    {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, enum: ['income', 'expense'], required: true, default: 'expense' },
        category: { type: String, required: true },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly'],
            required: true
        },
        startDate: { type: String, required: true },
        nextRunDate: { type: String, required: true },
        lastRunDate: { type: String },
        active: { type: Boolean, default: true },
        walletId: { type: String, required: false },
    },
    { timestamps: true }
);

RecurringTransactionSchema.index({ userId: 1, active: 1 });
RecurringTransactionSchema.index({ nextRunDate: 1 });

export const RecurringTransactionModel = mongoose.models.RecurringTransaction || mongoose.model<IRecurringTransaction>("RecurringTransaction", RecurringTransactionSchema);
