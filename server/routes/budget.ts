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

    await budget.save();
    res.json({ success: true, data: budget });
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const addTransaction: RequestHandler = async (req, res) => {
  const { month, year } = req.query;
  const { name, planned, actual, category } = req.body;
  const userId = req.session?.user?.id;

  if (!month || !year || !name || planned === undefined || actual === undefined || !category) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const budget = await getOrCreateBudget(month as string, parseInt(year as string), userId);

    const transaction: Transaction = {
      id: generateId(),
      name,
      planned,
      actual,
      category: category as TransactionCategory,
    };

    budget.transactions.push(transaction);
    await budget.save();

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

    if (name !== undefined) transaction.name = name;
    if (planned !== undefined) transaction.planned = planned;
    if (actual !== undefined) transaction.actual = actual;

    await budget.save();
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
    budget.transactions.splice(index, 1);

    await budget.save();
    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
