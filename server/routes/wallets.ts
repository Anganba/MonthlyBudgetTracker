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
    order: doc.order,
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
        const wallets = await WalletModel.find({ userId }).sort({ order: 1, createdAt: -1 });
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

        // Get max order (highest order + 1)
        const lastWallet = await WalletModel.findOne({ userId }).sort({ order: -1 });
        const newOrder = (lastWallet?.order || 0) + 1;

        const wallet = await WalletModel.create({
            userId,
            order: newOrder,
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
            details: `Type: ${wallet.type}${wallet.balance > 0 ? `, Initial Balance: $${wallet.balance}` : ''}`
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

        // Track previous values for audit comparison
        const previousBalance = wallet.balance;
        const previousName = wallet.name;
        const previousType = wallet.type;
        const previousDescription = wallet.description;
        const previousColor = wallet.color;
        const previousIcon = wallet.icon;
        const previousIsDefault = wallet.isDefault;
        const previousIsSavingsWallet = wallet.isSavingsWallet;

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

        // If marked as savings wallet, unmark all others (except this one)
        if (isSavingsWallet !== undefined) {
            if (isSavingsWallet) {
                // Exclude current wallet from bulk update to prevent race condition
                await WalletModel.updateMany(
                    { userId, _id: { $ne: wallet._id } },
                    { isSavingsWallet: false }
                );
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

        // Create audit log for other wallet updates - only log fields that ACTUALLY changed
        const changes: string[] = [];
        if (name && name !== previousName) changes.push(`name: "${previousName}" → "${name}"`);
        if (type && type !== previousType) changes.push(`type: ${previousType} → ${type}`);
        if (description !== undefined && description !== previousDescription) changes.push('description');
        if (color && color !== previousColor) changes.push('color');
        if (icon && icon !== previousIcon) changes.push('icon');
        if (isDefault && !previousIsDefault) changes.push('set as default');
        if (isSavingsWallet !== undefined && isSavingsWallet !== previousIsSavingsWallet) {
            changes.push(isSavingsWallet ? 'marked as savings wallet' : 'unmarked as savings wallet');
        }

        if (changes.length > 0 && !(balance !== undefined && previousBalance !== balance)) {
            // Only log wallet_updated if there wasn't already a balance_change log
            await AuditLogModel.create({
                userId,
                entityType: 'wallet',
                entityId: id,
                entityName: wallet.name,
                changeType: 'wallet_updated',
                details: `Updated: ${changes.join(', ')}`
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
            details: `Type: ${wallet.type}, Final Balance: $${wallet.balance}`
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
    const changeType = req.query.changeType as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const limit = parseInt(req.query.limit as string) || 100; // Increased default limit
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const filter: any = { userId };

        if (entityType && entityType !== 'all') filter.entityType = entityType;
        if (entityId) filter.entityId = entityId;
        if (changeType && changeType !== 'all') filter.changeType = changeType;

        // Date range filtering
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLogModel.find(filter)
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset);

        res.json({ success: true, data: logs.map(mapToAuditLog) });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const logDataExport: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const username = req.session?.user?.username || 'User';
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const { format, dateRange, includedData } = req.body;

        await AuditLogModel.create({
            userId,
            entityType: 'profile',
            entityId: userId,
            entityName: username,
            changeType: 'data_exported',
            details: `${format?.toUpperCase()} | ${dateRange} | ${includedData || 'data'}`,
            timestamp: new Date()
        });

        res.json({ success: true, message: "Export logged" });
    } catch (error) {
        console.error("Log export error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const reorderWallets: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const { orderedIds } = req.body; // Array of wallet IDs in new order

        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ success: false, message: "Invalid data format" });
        }

        // Bulk update for performance
        const updates = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, userId },
                update: { $set: { order: index } }
            }
        }));

        if (updates.length > 0) {
            await WalletModel.bulkWrite(updates);
        }

        res.json({ success: true, message: "Wallets reordered successfully" });
    } catch (error) {
        console.error("Reorder wallets error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
