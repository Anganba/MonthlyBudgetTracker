import mongoose, { Schema, Document } from "mongoose";
import { Wallet } from "@shared/api";

export interface IWallet extends Document, Omit<Wallet, 'id'> {
    _id: mongoose.Types.ObjectId;
}

const WalletSchema = new Schema<IWallet>(
    {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['cash', 'mfs', 'bank', 'credit_card', 'debit_card', 'virtual_card', 'other'], default: 'mfs' },
        balance: { type: Number, default: 0 },
        description: { type: String, default: '' },
        icon: { type: String },
        color: { type: String },
        isDefault: { type: Boolean, default: false }
    },
    { timestamps: true }
);

// Index for lookup
WalletSchema.index({ userId: 1 });

// Ensure only one default per user (handled in logic or generic index?)
// For now logic is safer or partial index.

// Prevent overwrite on hot reload
if (mongoose.models.Wallet) {
    delete mongoose.models.Wallet;
}

export const WalletModel = mongoose.model<IWallet>("Wallet", WalletSchema);
