import { RequestHandler } from "express";
import { RecurringTransactionModel } from "../models/RecurringTransaction";
import { RecurringTransaction } from "@shared/api";

export const getRecurringTransactions: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const recurs = await RecurringTransactionModel.find({ userId }).sort({ nextRunDate: 1 });
        const data = recurs.map(doc => ({
            id: doc._id.toString(),
            userId: doc.userId,
            name: doc.name,
            amount: doc.amount,
            category: doc.category,
            frequency: doc.frequency,
            startDate: doc.startDate,
            nextRunDate: doc.nextRunDate,
            lastRunDate: doc.lastRunDate,
            active: doc.active,
            walletId: doc.walletId,
            createdAt: (doc as any).createdAt?.toISOString(),
        }));
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching recurring transactions:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const createRecurringTransaction: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    const { name, amount, category, frequency, startDate, walletId } = req.body;

    if (!name || amount === undefined || !category || !frequency || !startDate) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const newItem = await RecurringTransactionModel.create({
            userId,
            name,
            amount,
            category,
            frequency,
            startDate,
            nextRunDate: startDate, // First run is on start date
            active: true,
            walletId: walletId || undefined
        });

        res.json({ success: true, data: { ...newItem.toObject(), id: newItem._id.toString() } });
    } catch (error) {
        console.error("Error creating recurring transaction:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateRecurringTransaction: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });


    try {
        const item = await RecurringTransactionModel.findOne({ _id: id, userId });
        if (!item) return res.status(404).json({ success: false, message: "Not found" });

        const allowedUpdates = ['name', 'amount', 'category', 'frequency', 'startDate', 'nextRunDate', 'active', 'walletId'];
        allowedUpdates.forEach(key => {
            if (req.body[key] !== undefined) (item as any)[key] = req.body[key];
        });

        await item.save();
        res.json({ success: true, data: { ...item.toObject(), id: item._id.toString() } });
    } catch (error) {
        console.error("Error updating recurring transaction:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteRecurringTransaction: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        await RecurringTransactionModel.deleteOne({ _id: id, userId });
        res.json({ success: true, message: "Deleted" });
    } catch (error) {
        console.error("Error deleting recurring transaction:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
