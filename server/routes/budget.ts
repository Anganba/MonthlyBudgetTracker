import { RequestHandler } from "express";
import { BudgetMonth, Transaction, TransactionCategory } from "@shared/api";
import { Budget, IBudget } from "../models/Budget";

const generateId = () => Math.random().toString(36).substring(2, 9);

const getOrCreateBudget = async (month: string, year: number, userId: string): Promise<IBudget> => {
  let budget = await Budget.findOne({ month, year, userId });

  if (!budget) {
    // Attempt to find the most recent budget to copy limits/rollover from
    const lastBudget = await Budget.findOne({ userId }).sort({ year: -1, month: -1 });

    budget = await Budget.create({
      month,
      year,
      rolloverPlanned: 0,
      rolloverActual: 0,
      categoryLimits: lastBudget?.categoryLimits || {},
      transactions: [],
      userId,
    });
  }

  // Check and process recurring transactions
  try {
    const { RecurringTransactionModel } = await import("../models/RecurringTransaction");
    const { startOfDay, addDays, addWeeks, addMonths, addYears, format, isAfter, isSameDay } = await import("date-fns");

    // Get all active recurring transactions for this user
    const recurring = await RecurringTransactionModel.find({ userId, active: true, nextRunDate: { $lte: format(new Date(), 'yyyy-MM-dd') } });

    if (recurring.length > 0) {
      console.log(`Processing ${recurring.length} due recurring transactions for user ${userId}`);
      let changesMade = false;
      const today = new Date(); // Current date for processing

      for (const rule of recurring) {
        // Create transaction
        const newTransaction: Transaction = {
          id: generateId(),
          name: rule.name,
          planned: rule.amount, // recurring amount is usually planned ? or actual? User usually sets the bill amount. Let's assume actual=amount, planned=amount
          actual: rule.amount,
          category: rule.category,
          date: rule.nextRunDate, // Use the date it was supposed to run
          goalId: undefined
        };

        // Find the correct budget month for this transaction date
        // Note: The `budget` object we have is for the requested month/year.
        // But the recurring transaction might be for a PAST or FUTURE month relative to the requested one?
        // Actually, if we are just fetching the dashboard, we should probably process ALL due transactions 
        // and put them in their respective budget months.
        // However, simplify: We heavily rely on the user opening the app.
        // If we put it in the WRONG budget month (e.g. requested Jan, but trans is for Feb), it won't return in THIS request.
        // Use robust approach: Find/Create the specific budget for the transaction date.

        const transDate = new Date(rule.nextRunDate);
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const tMonth = months[transDate.getMonth()];
        const tYear = transDate.getFullYear();

        let targetBudget = budget;
        if (tMonth !== month || tYear !== year) {
          // Different month, find/create that one
          targetBudget = await Budget.findOne({ month: tMonth, year: tYear, userId }) as any;
          if (!targetBudget) {
            targetBudget = await Budget.create({
              month: tMonth, year: tYear, transactions: [], userId,
              rolloverPlanned: 0, rolloverActual: 0
            });
          }
        }

        targetBudget.transactions.push(newTransaction);
        await targetBudget.save();

        // Update next run date
        let nextDate = new Date(rule.nextRunDate);
        switch (rule.frequency) {
          case 'daily': nextDate = addDays(nextDate, 1); break;
          case 'weekly': nextDate = addWeeks(nextDate, 1); break;
          case 'monthly': nextDate = addMonths(nextDate, 1); break;
          case 'yearly': nextDate = addYears(nextDate, 1); break;
        }

        rule.lastRunDate = rule.nextRunDate;
        rule.nextRunDate = format(nextDate, 'yyyy-MM-dd');
        await rule.save();
        changesMade = true;
      }

      // If we modified the CURRENT requested budget, we need to reload it to return fresh data
      if (changesMade) {
        const freshBudget = await Budget.findOne({ month, year, userId });
        if (freshBudget) return freshBudget;
      }
    }
  } catch (error) {
    console.error("Error processing recurring transactions:", error);
    // Don't block the UI loading if this background task fails
  }

  return budget;
};

const recalculateGoalTotal = async (goalId: string, userId: string) => {
  const { Goal } = await import("../models/Goal");
  console.log(`[Recalc] Starting for GoalId: ${goalId}, UserId: ${userId}`);

  try {
    const result = await Budget.aggregate([
      { $match: { userId } },
      { $unwind: "$transactions" },
      { $match: { "transactions.goalId": goalId } },
      {
        $project: {
          amount: "$transactions.actual",
          category: "$transactions.category"
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    console.log('[Recalc] Aggregation Result:', JSON.stringify(result));

    const total = result[0]?.total || 0;
    console.log(`[Recalc] Updating Goal ${goalId} with new total: ${total}`);

    await Goal.updateOne({ _id: goalId, userId }, { currentAmount: total });
  } catch (error) {
    console.error(`[Recalc] Error calculating goal total for ${goalId}:`, error);
  }
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
  // Ignore query params for target budget, rely on transaction date
  // const { month, year } = req.query; 
  const { name, planned, actual, category, date, goalId } = req.body;
  const userId = req.session?.user?.id;

  if (!name || planned === undefined || actual === undefined || !category || !date) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const dateObj = new Date(date);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const targetMonth = monthNames[dateObj.getMonth()];
    const targetYear = dateObj.getFullYear();

    const budget = await getOrCreateBudget(targetMonth, targetYear, userId);

    if (goalId) {
      // Validate goal exists first
      const { Goal } = await import("../models/Goal");
      const goal = await Goal.findOne({ _id: goalId, userId });
      if (!goal) {
        // Goal not found logic
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
    const sourceBudget = await Budget.findOne({ month: month as string, year: parseInt(year as string), userId });

    if (!sourceBudget) {
      return res.status(404).json({ success: false, message: "Budget not found" });
    }

    const transaction = sourceBudget.transactions.find(t => t.id === id as string);

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const oldGoalId = transaction.goalId;

    // Check if we need to move the transaction (date change check)
    let targetMonth = month as string;
    let targetYear = parseInt(year as string);
    const newDate = req.body.date;

    if (newDate) {
      const dateObj = new Date(newDate);
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      targetMonth = monthNames[dateObj.getMonth()];
      targetYear = dateObj.getFullYear();
    }

    // Capture IDs for goal recalculation
    const goalsToUpdate = new Set<string>();
    if (oldGoalId) goalsToUpdate.add(oldGoalId);

    // If bucket changed, we move the transaction
    if (targetMonth !== (month as string) || targetYear !== parseInt(year as string)) {
      // 1. Remove from source
      const index = sourceBudget.transactions.findIndex(t => t.id === id as string);
      sourceBudget.transactions.splice(index, 1);
      await sourceBudget.save();

      // 2. Get/Create Target Budget
      const targetBudget = await getOrCreateBudget(targetMonth, targetYear, userId);

      // 3. Create updated transaction object (since we are moving it)
      // We apply updates here
      const updatedTransaction = { ...(transaction as any).toObject() }; // Clone standard obj
      // Note: 'transaction' is a Mongoose Document, toObject() gives raw JS obj. 
      // Ensure we keep the string 'id' but maybe generate new _id to avoid collisions or let Mongoose handle it.
      // Usually better to let Mongoose gen new _id effectively for subdoc.
      delete updatedTransaction._id;

      if (name !== undefined) updatedTransaction.name = name;
      if (planned !== undefined) updatedTransaction.planned = planned;
      if (actual !== undefined) updatedTransaction.actual = actual;
      if (req.body.category !== undefined) updatedTransaction.category = req.body.category;
      if (req.body.date !== undefined) updatedTransaction.date = req.body.date;
      if (req.body.goalId !== undefined) updatedTransaction.goalId = req.body.goalId;

      targetBudget.transactions.push(updatedTransaction as Transaction);
      await targetBudget.save();

      if (updatedTransaction.goalId) goalsToUpdate.add(updatedTransaction.goalId);

    } else {
      // Same bucket, update in place
      if (name !== undefined) transaction.name = name;
      if (planned !== undefined) transaction.planned = planned;
      if (actual !== undefined) transaction.actual = actual;
      if (req.body.category !== undefined) transaction.category = req.body.category;
      if (req.body.date !== undefined) transaction.date = req.body.date;
      if (req.body.goalId !== undefined) transaction.goalId = req.body.goalId;

      await sourceBudget.save();

      if (transaction.goalId) goalsToUpdate.add(transaction.goalId);
    }

    // Recalculate Goals
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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



export const getYearlyStats: RequestHandler = async (req, res) => {
  const { year } = req.query;
  const userId = req.session?.user?.id;

  if (!year || !userId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const y = parseInt(year as string);

    const aggregation = await Budget.aggregate([
      { $match: { userId, year: y } },
      { $unwind: "$transactions" },
      {
        $match: {
          "transactions.category": { $nin: ['income', 'Paycheck', 'Bonus', 'Debt Added', 'Savings'] }
        }
      },
      {
        $group: {
          _id: "$month",
          totalExpense: { $sum: "$transactions.actual" }
        }
      }
    ]);

    const monthlyStats = Array(12).fill(0).map((_, i) => {
      const mName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][i];
      const found = aggregation.find(stat => stat._id === mName);
      return {
        name: mName.substring(0, 3), // Jan, Feb...
        expense: found ? found.totalExpense : 0
      };
    });

    res.json({ success: true, data: monthlyStats });
  } catch (error) {
    console.error("Error fetching yearly stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getMonthlyStats: RequestHandler = async (req, res) => {
  const { month, year } = req.query;
  const userId = req.session?.user?.id;

  if (!month || !year || !userId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const m = month as string;
    const y = parseInt(year as string);

    // Get basic budget info first (rollover, etc) - cheap query
    const budgetDoc = await Budget.findOne({ userId, month: m, year: y }).select('rolloverActual');
    const startBalance = budgetDoc ? budgetDoc.rolloverActual : 0;

    // Map month name to number (01-12)
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthIndex = monthNames.indexOf(m);
    if (monthIndex === -1) throw new Error("Invalid month name");

    const monthNum = (monthIndex + 1).toString().padStart(2, '0');
    const datePattern = new RegExp(`^${y}-${monthNum}`);

    const stats = await Budget.aggregate([
      // Match ALL budgets for the year to catch misplaced transactions
      { $match: { userId, year: y } },
      {
        $facet: {
          // 1. Group by Category for Pie Chart
          "expensesByCategory": [
            { $unwind: "$transactions" },
            {
              $match: {
                "transactions.category": { $nin: ['income', 'Paycheck', 'Bonus', 'Debt Added', 'Savings'] },
                "transactions.actual": { $gt: 0 },
                "transactions.date": { $regex: datePattern }
              }
            },
            { $group: { _id: "$transactions.category", value: { $sum: "$transactions.actual" } } },
            { $sort: { value: -1 } }
          ],
          // 2. Daily Flow
          "dailyFlow": [
            { $unwind: "$transactions" },
            {
              $match: {
                "transactions.date": { $regex: datePattern }
              }
            },
            {
              $group: {
                _id: { $dayOfMonth: { $dateFromString: { dateString: "$transactions.date" } } },
                income: {
                  $sum: {
                    $cond: [{ $in: ["$transactions.category", ['income', 'Paycheck', 'Bonus', 'Debt Added']] }, "$transactions.actual", 0]
                  }
                },
                expense: {
                  $sum: {
                    $cond: [{ $and: [{ $not: { $in: ["$transactions.category", ['income', 'Paycheck', 'Bonus', 'Debt Added']] } }, { $ne: ["$transactions.category", "Savings"] }] }, "$transactions.actual", 0]
                  }
                },
                savings: {
                  $sum: {
                    $cond: [{ $eq: ["$transactions.category", "Savings"] }, "$transactions.actual", 0]
                  }
                }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    // Reshape data for frontend
    const result = stats[0]; // Facet returns array with 1 obj

    // Pie Data
    const pieData = result.expensesByCategory.map((item: any) => ({ name: item._id, value: item.value }));

    // Daily Data (Map to days of month)
    // Note: Frontend currently generates all days. We can return sparse data or fill it here.
    // Let's return sparse and let frontend/hook fill/map it if needed, or fill it here.
    // Filling here is better for "Optimizing".

    // Use date-fns logic equivalent or simple loop
    const daysInMonth = new Date(y, ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"].indexOf(m) + 1, 0).getDate();

    const dailyData = [];
    const flowMap = new Map(result.dailyFlow.map((f: any) => [f._id, f]));

    for (let i = 1; i <= daysInMonth; i++) {
      const dayStat = flowMap.get(i) || { income: 0, expense: 0, savings: 0 };
      // Date formatting usually done on frontend, let's send parts
      dailyData.push({
        day: i,
        income: (dayStat as any).income,
        expense: (dayStat as any).expense,
        savings: (dayStat as any).savings
      });
    }

    res.json({
      success: true,
      data: {
        pieData,
        dailyData,
        startBalance
      }
    });

  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllTransactions: RequestHandler = async (req, res) => {
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    // Fetch all budgets for the user
    const budgets = await Budget.find({ userId });

    // Extract and flatten transactions
    let allTransactions: Transaction[] = [];
    budgets.forEach(budget => {
      allTransactions = allTransactions.concat(budget.transactions);
    });

    // Sort by date descending
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ success: true, data: allTransactions });
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
