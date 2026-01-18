import { RequestHandler } from "express";
import { Goal as GoalModel } from "../models/Goal";
import { Goal } from "@shared/api";
import { AuditLogModel } from "../models/WalletAuditLog";

const mapToGoal = (doc: any): Goal => ({
    id: doc._id.toString(),
    userId: doc.userId,
    name: doc.name,
    targetAmount: doc.targetAmount,
    currentAmount: doc.currentAmount,
    targetDate: doc.targetDate?.toISOString(),
    category: doc.category,
    description: doc.description,
    color: doc.color,
    status: doc.status || 'active',
    completedAt: doc.completedAt?.toISOString(),
    startedAt: doc.startedAt?.toISOString(),
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

    const { name, targetAmount, currentAmount, color, targetDate, category, description, startedAt } = req.body;

    if (!name || targetAmount === undefined) {
        return res.status(400).json({ success: false, message: "Name and Target Amount are required" });
    }

    try {
        const goal = await GoalModel.create({
            userId,
            name,
            targetAmount,
            currentAmount: currentAmount || 0,
            color,
            targetDate: targetDate ? new Date(targetDate) : undefined,
            category,
            description,
            startedAt: startedAt ? new Date(startedAt) : new Date(),
            status: 'active'
        });

        // Create audit log for goal creation
        await AuditLogModel.create({
            userId,
            entityType: 'goal',
            entityId: goal._id.toString(),
            entityName: name,
            changeType: 'goal_created',
            details: `Target: $${targetAmount}${category ? `, Category: ${category}` : ''}${targetDate ? `, Due: ${new Date(targetDate).toLocaleDateString()}` : ''}`
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

    const { name, targetAmount, currentAmount, color, status, targetDate, category, description, startedAt, completedAt } = req.body;
    console.log(`[UpdateGoal] Request body for ${id}:`, req.body);


    try {
        const goal = await GoalModel.findOne({ _id: id, userId });
        if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

        const previousStatus = goal.status;
        // Capture old values for change detection
        const oldName = goal.name;
        const oldTargetAmount = goal.targetAmount;
        const oldCategory = goal.category;
        const oldDescription = goal.description;
        const oldTargetDate = goal.targetDate?.toISOString();

        if (name !== undefined) goal.name = name;
        if (targetAmount !== undefined) goal.targetAmount = targetAmount;
        if (currentAmount !== undefined) goal.currentAmount = currentAmount;
        if (color !== undefined) goal.color = color;
        if (targetDate !== undefined) goal.targetDate = targetDate ? new Date(targetDate) : undefined;
        if (category !== undefined) goal.category = category;
        if (description !== undefined) goal.description = description;
        if (startedAt !== undefined) goal.startedAt = startedAt ? new Date(startedAt) : undefined;
        if (completedAt !== undefined) goal.completedAt = completedAt ? new Date(completedAt) : undefined;

        if (status) {
            goal.status = status;
            if (status === 'fulfilled' && !goal.completedAt) {
                goal.completedAt = new Date();
            } else if (status === 'active') {
                goal.completedAt = undefined;
            }
        }

        await goal.save();

        // Create audit logs for status changes
        if (status && status !== previousStatus) {
            if (status === 'fulfilled') {
                // Goal moved to Hall of Fame
                await AuditLogModel.create({
                    userId,
                    entityType: 'goal',
                    entityId: id,
                    entityName: goal.name,
                    changeType: 'goal_fulfilled',
                    details: `Goal completed! Target: $${goal.targetAmount}, Category: ${goal.category}`
                });
            } else if (status === 'active' && (previousStatus === 'fulfilled' || previousStatus === 'archived')) {
                // Goal reactivated from archived or fulfilled
                await AuditLogModel.create({
                    userId,
                    entityType: 'goal',
                    entityId: id,
                    entityName: goal.name,
                    changeType: 'goal_reactivated',
                    details: 'Goal reactivated from Hall of Fame'
                });
            }
        } else if (!status || status === previousStatus) {
            // Regular update (not a status change) - only log actual changes
            const changes: string[] = [];
            if (name !== undefined && name !== oldName) changes.push(`name: "${oldName}" → "${name}"`);
            if (targetAmount !== undefined && targetAmount !== oldTargetAmount) changes.push(`target: $${oldTargetAmount} → $${targetAmount}`);
            if (category !== undefined && category !== oldCategory) changes.push(`category: ${oldCategory} → ${category}`);
            if (description !== undefined && description !== oldDescription) changes.push(`description`);
            if (targetDate !== undefined) {
                const newTargetDate = targetDate ? new Date(targetDate).toISOString() : undefined;
                if (newTargetDate !== oldTargetDate) changes.push(`target date`);
            }

            if (changes.length > 0) {
                await AuditLogModel.create({
                    userId,
                    entityType: 'goal',
                    entityId: id,
                    entityName: goal.name,
                    changeType: 'goal_updated',
                    details: `Updated: ${changes.join(', ')}`
                });
            }
        }

        console.log(`[UpdateGoal] Updated goal ${id} status to ${goal.status}`);
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
        const goal = await GoalModel.findOne({ _id: id, userId });
        if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

        const goalName = goal.name;
        const goalDetails = {
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            category: goal.category,
            status: goal.status
        };

        const result = await GoalModel.deleteOne({ _id: id, userId });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Goal not found" });

        // Create audit log for goal deletion
        await AuditLogModel.create({
            userId,
            entityType: 'goal',
            entityId: id,
            entityName: goalName,
            changeType: 'goal_deleted',
            details: `Target: $${goalDetails.targetAmount}, Progress: $${goalDetails.currentAmount}${goalDetails.category ? `, Category: ${goalDetails.category}` : ''}, Status: ${goalDetails.status}`
        });

        res.json({ success: true, message: "Goal deleted" });
    } catch (error) {
        console.error("Error deleting goal:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const resetGoalProgress: RequestHandler = async (req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    const { goalId } = req.body;
    if (!goalId) return res.status(400).json({ success: false, message: "Goal ID required" });

    try {
        // Import models
        const { Budget } = await import("../models/Budget");
        const { WalletModel } = await import("../models/Wallet");

        // Find the goal
        const goal = await GoalModel.findOne({ _id: goalId, userId });
        if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

        // Find all transactions linked to this goal (savings deposits)
        const budgets = await Budget.find({ userId });
        let totalReversed = 0;
        const walletRefunds: Record<string, number> = {}; // walletId -> amount to refund

        for (const budget of budgets) {
            const transactionsToRemove: string[] = [];

            for (const tx of budget.transactions) {
                // Match transactions linked to this goal (savings transactions)
                if (tx.goalId === goalId && (tx.type === 'savings' || tx.name?.includes(`Savings: ${goal.name}`))) {
                    transactionsToRemove.push(tx.id);
                    totalReversed += tx.actual || 0;

                    // Track wallet refunds - refund the source wallet, deduct from destination
                    if (tx.walletId) {
                        walletRefunds[tx.walletId] = (walletRefunds[tx.walletId] || 0) + (tx.actual || 0);
                    }
                    if (tx.toWalletId) {
                        walletRefunds[tx.toWalletId] = (walletRefunds[tx.toWalletId] || 0) - (tx.actual || 0);
                    }
                }
            }

            // Remove the transactions from the budget
            if (transactionsToRemove.length > 0) {
                budget.transactions = budget.transactions.filter(
                    (tx: any) => !transactionsToRemove.includes(tx.id)
                );
                await budget.save();
            }
        }

        // Update wallet balances
        for (const [walletId, amount] of Object.entries(walletRefunds)) {
            if (amount !== 0) {
                await WalletModel.findByIdAndUpdate(walletId, { $inc: { balance: amount } });
            }
        }

        // Reset goal's currentAmount to 0
        goal.currentAmount = 0;
        await goal.save();

        // Create audit log for goal reset
        await AuditLogModel.create({
            userId,
            entityType: 'goal',
            entityId: goalId,
            entityName: goal.name,
            changeType: 'goal_reset',
            details: `Reversed $${totalReversed.toLocaleString()} in savings transactions`
        });

        res.json({
            success: true,
            message: `Reset ${goal.name} - reversed $${totalReversed.toLocaleString()} in savings transactions`
        });
    } catch (error) {
        console.error("Error resetting goal progress:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
