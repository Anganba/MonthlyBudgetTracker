import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
    _id: mongoose.Types.ObjectId;
    userId: string;
    entityType: 'wallet' | 'goal' | 'recurring' | 'transaction';
    entityId: string;
    entityName: string;
    changeType:
    | 'balance_change'
    | 'wallet_created'
    | 'wallet_updated'
    | 'wallet_deleted'
    | 'goal_created'
    | 'goal_fulfilled'
    | 'goal_reactivated'
    | 'goal_deleted'
    | 'recurring_created'
    | 'recurring_deleted'
    | 'transaction_deleted';
    previousBalance?: number;
    newBalance?: number;
    changeAmount?: number;
    details?: string;
    reason?: string;
    timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        userId: { type: String, required: true, index: true },
        entityType: {
            type: String,
            enum: ['wallet', 'goal', 'recurring', 'transaction'],
            required: true
        },
        entityId: { type: String, required: true, index: true },
        entityName: { type: String, required: true },
        changeType: {
            type: String,
            enum: [
                'balance_change',
                'wallet_created',
                'wallet_updated',
                'wallet_deleted',
                'goal_created',
                'goal_fulfilled',
                'goal_reactivated',
                'goal_deleted',
                'recurring_created',
                'recurring_deleted',
                'transaction_deleted'
            ],
            required: true
        },
        previousBalance: { type: Number },
        newBalance: { type: Number },
        changeAmount: { type: Number },
        details: { type: String },
        reason: { type: String },
        timestamp: { type: Date, default: Date.now }
    },
    { timestamps: false }
);

// Compound indexes for efficient queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ entityId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, entityType: 1, timestamp: -1 });

// Prevent overwrite on hot reload
if (mongoose.models.AuditLog) {
    delete mongoose.models.AuditLog;
}
// Also clean up old model name
if (mongoose.models.WalletAuditLog) {
    delete mongoose.models.WalletAuditLog;
}

export const AuditLogModel = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

// Keep backward compatibility alias
export const WalletAuditLogModel = AuditLogModel;
