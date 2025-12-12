import { RequestHandler } from "express";
import { Goal as GoalModel } from "../models/Goal";
import { Goal } from "@shared/api";

const mapToGoal = (doc: any): Goal => ({
    id: doc._id.toString(),
    userId: doc.userId,
    name: doc.name,
    targetAmount: doc.targetAmount,
    currentAmount: doc.currentAmount,
    color: doc.color,
    createdAt: doc.createdAt?.toISOString(),
});

export const getGoals: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const goals = await GoalModel.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: goals.map(mapToGoal) });
    } catch (error) {
        console.error("Error fetching goals:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const createGoal: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    const { name, targetAmount, currentAmount, color } = req.body;

    if (!name || targetAmount === undefined) {
        return res.status(400).json({ success: false, message: "Name and Target Amount are required" });
    }

    try {
        const goal = await GoalModel.create({
            userId,
            name,
            targetAmount,
            currentAmount: currentAmount || 0,
            color
        });
        res.json({ success: true, data: mapToGoal(goal) });
    } catch (error) {
        console.error("Error creating goal:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateGoal: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    const { name, targetAmount, currentAmount, color } = req.body;

    try {
        const goal = await GoalModel.findOne({ _id: id, userId });
        if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

        if (name) goal.name = name;
        if (targetAmount !== undefined) goal.targetAmount = targetAmount;
        if (currentAmount !== undefined) goal.currentAmount = currentAmount;
        if (color !== undefined) goal.color = color;

        await goal.save();
        res.json({ success: true, data: mapToGoal(goal) });
    } catch (error) {
        console.error("Error updating goal:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteGoal: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const result = await GoalModel.deleteOne({ _id: id, userId });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Goal not found" });

        res.json({ success: true, message: "Goal deleted" });
    } catch (error) {
        console.error("Error deleting goal:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
