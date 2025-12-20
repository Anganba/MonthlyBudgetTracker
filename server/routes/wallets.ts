import { RequestHandler } from "express";
import { WalletModel } from "../models/Wallet";
import { Wallet } from "@shared/api";

const mapToWallet = (doc: any): Wallet => ({
    id: doc._id.toString(),
    userId: doc.userId,
    name: doc.name,
    type: doc.type,
    balance: doc.balance,
    icon: doc.icon,
    color: doc.color,
    isDefault: doc.isDefault,
    createdAt: doc.createdAt
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

    const { name, type, balance, color, icon, isDefault } = req.body;

    try {
        if (isDefault) {
            // Unset other defaults
            await WalletModel.updateMany({ userId }, { isDefault: false });
        }

        const wallet = await WalletModel.create({
            userId,
            name,
            type,
            balance: balance || 0,
            color,
            icon,
            isDefault: !!isDefault
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

        const { name, type, balance, color, icon, isDefault } = req.body;

        if (name) wallet.name = name;
        if (type) wallet.type = type;
        if (balance !== undefined) wallet.balance = balance;
        if (color) wallet.color = color;
        if (icon) wallet.icon = icon;

        if (isDefault) {
            await WalletModel.updateMany({ userId }, { isDefault: false });
            wallet.isDefault = true;
        }

        await wallet.save();
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
        await WalletModel.deleteOne({ _id: id, userId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
