import { RequestHandler } from "express";
import { BudgetMonth, Transaction, TransactionCategory } from "@shared/api";
import { Budget, IBudget } from "../models/Budget";

const generateId = () => Math.random().toString(36).substring(2, 9);

const getOrCreateBudget = async (month: string, year: number, userId: string): Promise<IBudget> => {
  let budget = await Budget.findOne({ month, year, userId });

  if (!budget) {
    budget = await Budget.create({
      month,
      year,
      rolloverPlanned: 0,
      rolloverActual: 0,
      transactions: [],
      userId,
    });
  }
  return budget;
};

const recalculateGoalTotal = async (goalId: string, userId: string) => {
  const { Goal } = await import("../models/Goal");
  console.log(`[Recalc] GoalId: ${goalId}, UserId: ${userId}`);
  const result = await Budget.aggregate([
    { $match: { userId } },
    { $unwind: "$transactions" },
    { $match: { "transactions.goalId": goalId } },
    {
      $project: {
        category: "$transactions.category",
        actual: "$transactions.actual",
        amount: {
          $cond: {
            if: { $eq: ["$transactions.category", "Savings"] },
            then: { $abs: "$transactions.actual" },
            else: "$transactions.actual"
          }
        }
      }
    },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
  ]);
  console.log('[Recalc] Aggregation Result:', result);
  const total = result[0]?.total || 0;
  await Goal.updateOne({ _id: goalId, userId }, { currentAmount: total });
};

export const getBudget: RequestHandler = async (req, res) => {
  const { month, year } = req.query;
  const userId = req.session?.user?.id;

  if (!month || !year) {
    return res.status(400).json({ success: false, message: "Missing month or year" });
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const budget = await getOrCreateBudget(month as string, parseInt(year as string), userId);
    res.json({ success: true, data: budget });
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateBudget: RequestHandler = async (req, res) => {
  const { month, year } = req.query;
  const { rolloverPlanned, rolloverActual } = req.body;
  const userId = req.session?.user?.id;

  if (!month || !year) {
    return res.status(400).json({ success: false, message: "Missing month or year" });
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const budget = await getOrCreateBudget(month as string, parseInt(year as string), userId);

    if (rolloverPlanned !== undefined) budget.rolloverPlanned = rolloverPlanned;
    if (rolloverActual !== undefined) budget.rolloverActual = rolloverActual;
    if (req.body.categoryLimits !== undefined) {
      console.log('Updating category limits:', req.body.categoryLimits);
      budget.categoryLimits = req.body.categoryLimits;
      budget.markModified('categoryLimits');
    }

    await budget.save();
    console.log('Budget saved, limits:', budget.categoryLimits);
    res.json({ success: true, data: budget });
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const addTransaction: RequestHandler = async (req, res) => {
  const { month, year } = req.query;
  const { name, planned, actual, category, date, goalId } = req.body;
  const userId = req.session?.user?.id;

  if (!month || !year || !name || planned === undefined || actual === undefined || !category || !date) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const budget = await getOrCreateBudget(month as string, parseInt(year as string), userId);

    if (goalId) {
      // Validate goal exists first
      const { Goal } = await import("../models/Goal");
      const goal = await Goal.findOne({ _id: goalId, userId });
      if (!goal) {
        // If goal doesn't exist, maybe we shouldn't link it?
        // Proceeding but setting goalId to undefined is safer, or just let it fail silently at recalc?
        // Let's keep goalId but recalc will ignore it if not found (or should I check?)
        // Recalc updates Goal model. If goal deleted, nothing happens.
      }
    }

    const transaction: Transaction = {
      id: generateId(),
      name,
      planned,
      actual,
      category: category as TransactionCategory,
      date,
      goalId,
    };

    budget.transactions.push(transaction);
    await budget.save();

    if (goalId) {
      await recalculateGoalTotal(goalId, userId);
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateTransaction: RequestHandler = async (req, res) => {
  const { month, year, id } = req.query;
  const { name, planned, actual } = req.body;
  const userId = req.session?.user?.id;

  if (!month || !year || !id) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const budget = await Budget.findOne({ month: month as string, year: parseInt(year as string), userId });

    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }

    const transaction = budget.transactions.find(t => t.id === id as string);

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const oldGoalId = transaction.goalId;
    const oldActual = transaction.actual;
    const oldCategory = transaction.category;

    if (name !== undefined) transaction.name = name;
    if (planned !== undefined) transaction.planned = planned;
    if (actual !== undefined) transaction.actual = actual;
    if (req.body.category !== undefined) transaction.category = req.body.category;
    if (req.body.date !== undefined) transaction.date = req.body.date;
    if (req.body.goalId !== undefined) transaction.goalId = req.body.goalId;

    const newGoalId = transaction.goalId;
    const newActual = transaction.actual;
    const newCategory = transaction.category;

    // Sync with Goals
    await budget.save();

    const goalsToUpdate = new Set<string>();
    if (oldGoalId) goalsToUpdate.add(oldGoalId);
    if (newGoalId) goalsToUpdate.add(newGoalId);

    for (const gid of goalsToUpdate) {
      await recalculateGoalTotal(gid, userId);
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteTransaction: RequestHandler = async (req, res) => {
  const { month, year, id } = req.query;
  const userId = req.session?.user?.id;

  if (!month || !year || !id) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const budget = await Budget.findOne({ month: month as string, year: parseInt(year as string), userId });

    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }

    const index = budget.transactions.findIndex(t => t.id === id as string);

    if (index === -1) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const transaction = budget.transactions[index];

    const deletedGoalId = transaction.goalId;

    budget.transactions.splice(index, 1);
    await budget.save();

    if (deletedGoalId) {
      await recalculateGoalTotal(deletedGoalId, userId);
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
