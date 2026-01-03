import { RequestHandler } from "express";
import { WalletModel } from "../models/Wallet";
import { AuditLogModel } from "../models/WalletAuditLog";
import { Wallet, AuditLog } from "@shared/api";

const mapToWallet = (doc: any): Wallet => ({
    id: doc._id.toString(),
    userId: doc.userId,
    name: doc.name,
    type: doc.type,
    balance: doc.balance,
    description: doc.description,
    icon: doc.icon,
    color: doc.color,
    isDefault: doc.isDefault,
    isSavingsWallet: doc.isSavingsWallet,
    createdAt: doc.createdAt
});

const mapToAuditLog = (doc: any): AuditLog => ({
    id: doc._id.toString(),
    userId: doc.userId,
    entityType: doc.entityType,
    entityId: doc.entityId,
    entityName: doc.entityName,
    changeType: doc.changeType,
    previousBalance: doc.previousBalance,
    newBalance: doc.newBalance,
    changeAmount: doc.changeAmount,
    details: doc.details,
    reason: doc.reason,
    timestamp: doc.timestamp.toISOString()
});

export const getWallets: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const wallets = await WalletModel.find({ userId });
        res.json({ success: true, data: wallets.map(mapToWallet) });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const createWallet: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const { name, type, balance, description, color, icon, isDefault, isSavingsWallet } = req.body;

        // If marked as savings wallet, unmark all others
        if (isSavingsWallet) {
            await WalletModel.updateMany({ userId }, { isSavingsWallet: false });
        }

        const wallet = await WalletModel.create({
            userId,
            name,
            type,
            balance: balance || 0,
            description: description || '',
            color,
            icon,
            isDefault: !!isDefault,
            isSavingsWallet: !!isSavingsWallet
        });

        // Create audit log for wallet creation
        await AuditLogModel.create({
            userId,
            entityType: 'wallet',
            entityId: wallet._id.toString(),
            entityName: wallet.name,
            changeType: 'wallet_created',
            newBalance: wallet.balance,
            details: JSON.stringify({ type: wallet.type })
        });

        res.json({ success: true, data: mapToWallet(wallet) });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateWallet: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const wallet = await WalletModel.findOne({ _id: id, userId });
        if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

        const { name, type, balance, description, color, icon, isDefault, isSavingsWallet, reason } = req.body;

        // Track previous balance for audit
        const previousBalance = wallet.balance;

        if (name) wallet.name = name;
        if (type) wallet.type = type;
        if (balance !== undefined) wallet.balance = balance;
        if (description !== undefined) wallet.description = description;
        if (color) wallet.color = color;
        if (icon) wallet.icon = icon;

        if (isDefault) {
            await WalletModel.updateMany({ userId }, { isDefault: false });
            wallet.isDefault = true;
        }

        // If marked as savings wallet, unmark all others
        if (isSavingsWallet !== undefined) {
            if (isSavingsWallet) {
                await WalletModel.updateMany({ userId }, { isSavingsWallet: false });
                wallet.isSavingsWallet = true;
            } else {
                wallet.isSavingsWallet = false;
            }
        }

        await wallet.save();

        // Create audit log if balance changed
        if (balance !== undefined && previousBalance !== balance) {
            await AuditLogModel.create({
                userId,
                entityType: 'wallet',
                entityId: id,
                entityName: wallet.name,
                changeType: 'balance_change',
                previousBalance,
                newBalance: balance,
                changeAmount: balance - previousBalance,
                reason: reason || undefined
            });
        }

        res.json({ success: true, data: mapToWallet(wallet) });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteWallet: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        // Get wallet info before deletion for audit log
        const wallet = await WalletModel.findOne({ _id: id, userId });
        if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

        // Create audit log for wallet deletion
        await AuditLogModel.create({
            userId,
            entityType: 'wallet',
            entityId: id,
            entityName: wallet.name,
            changeType: 'wallet_deleted',
            previousBalance: wallet.balance,
            details: JSON.stringify({ type: wallet.type })
        });

        await WalletModel.deleteOne({ _id: id, userId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getWalletAuditLogs: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const logs = await AuditLogModel.find({ entityId: id, userId, entityType: 'wallet' })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset);

        res.json({ success: true, data: logs.map(mapToAuditLog) });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getUserAuditLogs: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const entityType = req.query.entityType as string;
    const entityId = req.query.entityId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const filter: any = { userId };
        if (entityType) filter.entityType = entityType;
        if (entityId) filter.entityId = entityId;

        const logs = await AuditLogModel.find(filter)
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset);

        res.json({ success: true, data: logs.map(mapToAuditLog) });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
