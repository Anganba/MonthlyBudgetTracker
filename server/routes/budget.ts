import { RequestHandler } from "express";
import { BudgetMonth, Transaction, TransactionCategory } from "@shared/api";
import { loadData, saveData, BudgetStore } from "../storage";

const generateId = () => Math.random().toString(36).substring(2, 9);

const getOrCreateBudget = async (month: string, year: number): Promise<BudgetMonth> => {
  const store = await loadData();
  const key = `${month}-${year}`;

  if (!store[key]) {
    store[key] = {
      id: generateId(),
      month,
      year,
      rolloverPlanned: 0,
      rolloverActual: 0,
      transactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveData(store);
  }
  return store[key];
};

export const getBudget: RequestHandler = async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ success: false, message: "Missing month or year" });
  }

  const budget = await getOrCreateBudget(month as string, parseInt(year as string));
  res.json({ success: true, data: budget });
};

export const updateBudget: RequestHandler = async (req, res) => {
  const { month, year } = req.query;
  const { rolloverPlanned, rolloverActual } = req.body;

  if (!month || !year) {
    return res.status(400).json({ success: false, message: "Missing month or year" });
  }

  const store = await loadData();
  const key = `${month}-${year}`;

  // Ensure budget exists
  if (!store[key]) {
    await getOrCreateBudget(month as string, parseInt(year as string));
    // Reload store after creation
    Object.assign(store, await loadData());
  }

  const budget = store[key];
  if (rolloverPlanned !== undefined) budget.rolloverPlanned = rolloverPlanned;
  if (rolloverActual !== undefined) budget.rolloverActual = rolloverActual;
  budget.updatedAt = new Date().toISOString();

  await saveData(store);
  res.json({ success: true, data: budget });
};

export const addTransaction: RequestHandler = async (req, res) => {
  const { month, year } = req.query;
  const { name, planned, actual, category } = req.body;

  if (!month || !year || !name || planned === undefined || actual === undefined || !category) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const store = await loadData();
  const key = `${month}-${year}`;

  // Ensure budget exists
  if (!store[key]) {
    await getOrCreateBudget(month as string, parseInt(year as string));
    Object.assign(store, await loadData());
  }

  const budget = store[key];
  const transaction: Transaction = {
    id: generateId(),
    name,
    planned,
    actual,
    category: category as TransactionCategory,
  };

  budget.transactions.push(transaction);
  budget.updatedAt = new Date().toISOString();

  await saveData(store);
  res.json({ success: true, data: transaction });
};

export const updateTransaction: RequestHandler = async (req, res) => {
  const { month, year, id } = req.query;
  const { name, planned, actual } = req.body;

  if (!month || !year || !id) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const store = await loadData();
  const key = `${month}-${year}`;
  const budget = store[key];

  if (!budget) {
    return res.status(404).json({ success: false, message: "Budget not found" });
  }

  const transaction = budget.transactions.find(t => t.id === id);

  if (!transaction) {
    return res.status(404).json({ success: false, message: "Transaction not found" });
  }

  if (name !== undefined) transaction.name = name;
  if (planned !== undefined) transaction.planned = planned;
  if (actual !== undefined) transaction.actual = actual;

  budget.updatedAt = new Date().toISOString();
  await saveData(store);

  res.json({ success: true, data: transaction });
};

export const deleteTransaction: RequestHandler = async (req, res) => {
  const { month, year, id } = req.query;

  if (!month || !year || !id) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const store = await loadData();
  const key = `${month}-${year}`;
  const budget = store[key];

  if (!budget) {
    return res.status(404).json({ success: false, message: "Budget not found" });
  }

  const index = budget.transactions.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Transaction not found" });
  }

  const transaction = budget.transactions[index];
  budget.transactions.splice(index, 1);
  budget.updatedAt = new Date().toISOString();

  await saveData(store);
  res.json({ success: true, data: transaction });
};
