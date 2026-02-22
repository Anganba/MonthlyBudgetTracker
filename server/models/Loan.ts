import mongoose, { Schema, Document } from "mongoose";
import { Loan, LoanPayment } from "@shared/api";

export interface ILoan extends Document, Omit<Loan, 'id' | 'payments' | 'topUps'> {
    _id: mongoose.Types.ObjectId;
    payments: (LoanPayment & { _id?: mongoose.Types.ObjectId })[];
    topUps?: (import('@shared/api').LoanTopUp & { _id?: mongoose.Types.ObjectId })[];
}

const LoanPaymentSchema = new Schema<LoanPayment>({
    id: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    timestamp: { type: String, required: false },
    walletId: { type: String, required: false },
    note: { type: String, required: false },
});

const LoanTopUpSchema = new Schema<import('@shared/api').LoanTopUp>({
    id: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    timestamp: { type: String, required: false },
    description: { type: String, required: false },
    walletId: { type: String, required: false },
});

const LoanSchema = new Schema<ILoan>(
    {
        userId: { type: String, required: true },
        personName: { type: String, required: true },
        direction: { type: String, enum: ['given', 'received'], required: true },
        totalAmount: { type: Number, required: true },
        remainingAmount: { type: Number, required: true },
        description: { type: String, default: '' },
        walletId: { type: String, required: false },
        status: { type: String, enum: ['active', 'settled'], default: 'active' },
        date: { type: String, required: true },
        dueDate: { type: String, required: false },
        payments: [LoanPaymentSchema],
        topUps: [LoanTopUpSchema],
    },
    { timestamps: true }
);

LoanSchema.index({ userId: 1 });
LoanSchema.index({ userId: 1, status: 1 });

// Prevent overwrite on hot reload
if (mongoose.models.Loan) {
    delete mongoose.models.Loan;
}

export const LoanModel = mongoose.model<ILoan>("Loan", LoanSchema);
