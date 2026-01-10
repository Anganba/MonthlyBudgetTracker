import { RequestHandler } from "express";
import { BudgetMonth, Transaction, TransactionCategory } from "@shared/api";
import { Budget, IBudget } from "../models/Budget";
import { AuditLogModel } from "../models/WalletAuditLog";

const generateId = () => Math.random().toString(36).substring(2, 9);

const getOrCreateBudget = async (month: string, year: number, userId: string): Promise<IBudget> => {
  let budget = await Budget.findOne({ month, year, userId });

  // Determine default limits from the most recent budget (chronologically) to ensure "recurring" limits available for any new creation
  let defaultLimits = {};
  try {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    // Fetch lightweight version of all budgets to sort correctly
    const allBudgets = await Budget.find({ userId }).select('month year categoryLimits').lean();
    if (allBudgets.length > 0) {
      // Filter to finding the latest budget that ACTUALLY has limits set
      // This prevents an empty future budget (like Jan 2026) from finding ITSELF as the latest and using empty limits
      const budgetsWithLimits = allBudgets.filter(b => b.categoryLimits && Object.keys(b.categoryLimits).length > 0);

      if (budgetsWithLimits.length > 0) {
        const sortedBudgets = budgetsWithLimits.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return months.indexOf(b.month) - months.indexOf(a.month);
        });
        defaultLimits = sortedBudgets[0].categoryLimits;
        console.log(`[Budget] Found latest limits from ${sortedBudgets[0].month} ${sortedBudgets[0].year}`);
      }
    }
  } catch (err) {
    console.error("Error determining default limits:", err);
  }

  if (!budget) {
    // Calculate default limits from previous month if available
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthIndex = months.indexOf(month);
    let prevMonthIndex = currentMonthIndex - 1;
    let prevYear = year;

    if (prevMonthIndex < 0) {
      prevMonthIndex = 11;
      prevYear = year - 1;
    }

    const prevMonthName = months[prevMonthIndex];
    const prevMonthBudget = await Budget.findOne({ userId, month: prevMonthName, year: prevYear });

    if (prevMonthBudget) {
      // Prefer immediate previous month for limits if available, otherwise use default (latest)
      if (Object.keys(prevMonthBudget.categoryLimits || {}).length > 0) {
        defaultLimits = prevMonthBudget.categoryLimits;
      }
    }

    // Create new budget with empty transactions
    // Wallet balances track actual money, so no need for auto-rollover transactions
    budget = await Budget.create({
      month,
      year,
      rolloverPlanned: 0,
      rolloverActual: 0,
      categoryLimits: defaultLimits,
      transactions: [],
      userId,
    });
  } else {
    // If budget exists but has NO limits, attempt to backfill from defaults (fixing the issue for pre-existing future months)
    let isEmpty = false;
    if (!budget.categoryLimits) {
      isEmpty = true;
    } else if (budget.categoryLimits instanceof Map) {
      isEmpty = budget.categoryLimits.size === 0;
    } else if (typeof budget.categoryLimits === 'object') {
      // Fallback if it was somehow treated as POJO
      isEmpty = Object.keys(budget.categoryLimits).length === 0;
    }

    if (isEmpty && defaultLimits && Object.keys(defaultLimits).length > 0) {
      console.log(`[Budget] Backfilling empty limits for ${month} ${year} from history.`);
      // Convert plain object to Map if necessary because schema defines it as Map
      if (!(defaultLimits instanceof Map)) {
        const limitMap = new Map<string, number>();
        for (const [k, v] of Object.entries(defaultLimits)) {
          limitMap.set(k, Number(v));
        }
        budget.categoryLimits = limitMap;
      } else {
        budget.categoryLimits = defaultLimits;
      }

      // We must mark as modified because it's a mixed/map type sometimes
      budget.markModified('categoryLimits');
      await budget.save();
    }
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
        // Check if transaction already exists for this rule and date (prevent duplicates from race conditions)
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
              rolloverPlanned: 0, rolloverActual: 0,
              categoryLimits: defaultLimits // Ensure limits are copied to auto-created budgets
            });
          }
        }

        // DUPLICATE CHECK: Skip if a transaction with same name, date, category already exists
        const existingTransaction = targetBudget.transactions.find(
          (t: Transaction) =>
            t.name === rule.name &&
            t.date === rule.nextRunDate &&
            t.category === rule.category &&
            t.walletId === (rule.walletId || undefined)
        );

        if (existingTransaction) {
          console.log(`[Recurring] Skipping duplicate for rule "${rule.name}" on ${rule.nextRunDate}`);
          // Still update nextRunDate to prevent repeated attempts
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
          continue; // Skip creating this transaction
        }

        // Create transaction
        const newTransaction: Transaction = {
          id: generateId(),
          name: rule.name,
          planned: rule.amount,
          actual: rule.amount,
          category: rule.category,
          date: rule.nextRunDate, // Use the date it was supposed to run
          timestamp: format(new Date(), 'HH:mm:ss'),
          goalId: undefined,
          walletId: rule.walletId || undefined
        };

        targetBudget.transactions.push(newTransaction);
        await targetBudget.save();

        if (rule.walletId) {
          const { WalletModel } = await import("../models/Wallet");
          const wallet = await WalletModel.findOne({ _id: rule.walletId, userId });
          if (wallet) {
            const isIncome = ['income', 'Paycheck', 'Bonus', 'Debt Added'].includes(rule.category);
            if (isIncome) wallet.balance += rule.amount;
            else wallet.balance -= rule.amount;
            await wallet.save();
            console.log(`[Recurring] Updated wallet ${rule.walletId} balance for rule ${rule.name}`);
          }
        }

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
          type: "$transactions.type",
          category: "$transactions.category"
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                // If type is 'expense', subtract; otherwise (savings/income/transfer), add
                { $eq: ["$type", "expense"] },
                { $multiply: ["$amount", -1] }, // Subtract expenses
                "$amount" // Add savings/income/transfer
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('[Recalc] Aggregation Result:', JSON.stringify(result));

    const total = result[0]?.total || 0;
    console.log(`[Recalc] Updating Goal ${goalId} with new total: ${total}`);

    await Goal.updateOne({ _id: goalId, userId }, { currentAmount: total });
  } catch (error) {
    console.error(`[Recalc] Error calculating goal total for ${goalId}:`, error);
  }

};

const recalculateRollovers = async (startMonth: string, startYear: number, userId: string) => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // 1. Bulk Fetch: Get all potentially relevant budgets (current and future)
  // We fetch anything from the start year onwards.
  const allBudgets = await Budget.find({
    userId,
    year: { $gte: startYear }
  });

  if (!allBudgets || allBudgets.length === 0) return;

  // 2. Sort budgets chronologically in memory
  const sortedBudgets = allBudgets.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return months.indexOf(a.month) - months.indexOf(b.month);
  });

  // 3. Find the index where our chain starts
  const startIndex = sortedBudgets.findIndex(b => b.year === startYear && b.month === startMonth);
  if (startIndex === -1) return; // Start budget not found, cannot propagate

  const updates = [];

  // 4. Propagate changes forward in memory
  // We iterate from the start budget up to the second-to-last budget
  for (let i = startIndex; i < sortedBudgets.length - 1; i++) {
    const currentBudget = sortedBudgets[i];
    const nextBudget = sortedBudgets[i + 1];

    // Check for continuity (no gaps in months)
    const currentMonthIdx = months.indexOf(currentBudget.month);
    let expectedNextMonthIdx = currentMonthIdx + 1;
    let expectedNextYear = currentBudget.year;
    if (expectedNextMonthIdx > 11) {
      expectedNextMonthIdx = 0;
      expectedNextYear++;
    }

    // If the next budget in the list is NOT the immediate next month, we stop (gap detected)
    if (nextBudget.month !== months[expectedNextMonthIdx] || nextBudget.year !== expectedNextYear) {
      break;
    }

    // Calculate Ending Balance of Current Budget
    // (This logic mirrors calculateStats/original logic)
    const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added'];

    const income = currentBudget.transactions
      .filter(t => incomeCategories.includes(t.category))
      .reduce((sum, t) => sum + t.actual, 0);

    const expenses = currentBudget.transactions
      .filter(t => !incomeCategories.includes(t.category) && t.category !== 'Savings' && t.category !== 'Transfer' && t.type !== 'transfer')
      .reduce((sum, t) => sum + t.actual, 0);

    const savings = currentBudget.transactions
      .filter(t => t.category === 'Savings')
      .reduce((sum, t) => sum + t.actual, 0);

    const startBalance = currentBudget.rolloverActual || 0;
    const endBalance = startBalance + income - expenses - savings;

    // Apply to Next Budget
    // Since 'nextBudget' is a reference to the object in 'sortedBudgets', 
    // modifying it here will affect the calculation in the NEXT iteration (where it becomes 'currentBudget').
    if (Math.abs(nextBudget.rolloverActual - endBalance) > 0.001) { // Float safety check
      console.log(`[Rollover] Updating ${nextBudget.month} ${nextBudget.year} rollover from ${nextBudget.rolloverActual} to ${endBalance}`);
      nextBudget.rolloverActual = endBalance;
      nextBudget.markModified('rolloverActual');
      updates.push(nextBudget);
    }
  }

  // 5. Bulk Save (Parallel)
  if (updates.length > 0) {
    await Promise.all(updates.map(b => b.save()));
    console.log(`[Rollover] Optimized propagation complete. Updated ${updates.length} budgets.`);
  }
};

export const getBudget: RequestHandler = async (req, res) => {
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
  const { name, planned, actual, category, date, goalId, walletId, type, toWalletId } = req.body;
  console.log('[API] addTransaction body:', { name, category, date, walletId, actual, type, toWalletId });
  const userId = req.session?.user?.id;

  if (!name || planned === undefined || actual === undefined || !category || !date) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    // Parse date string directly to avoid timezone issues
    // Frontend sends dates in "YYYY-MM-DD" format
    const dateParts = date.split('-');
    const targetYear = parseInt(dateParts[0], 10);
    const targetMonthIndex = parseInt(dateParts[1], 10) - 1; // Month is 1-indexed in the string
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const targetMonth = monthNames[targetMonthIndex];
    console.log('[API] Parsed date:', date, '-> Month:', targetMonth, 'Year:', targetYear);

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
      timestamp: req.body.timestamp, // HH:MM:SS format
      goalId,
      walletId,
      type: type || 'expense',
      toWalletId
    };

    budget.transactions.push(transaction);
    budget.markModified('transactions');
    await budget.save();

    if (goalId) {
      await recalculateGoalTotal(goalId, userId);
    }

    if (walletId) {
      const { WalletModel } = await import("../models/Wallet");
      const { AuditLogModel } = await import("../models/WalletAuditLog");
      const wallet = await WalletModel.findOne({ _id: walletId, userId });

      const transactionType = req.body.type || 'expense';
      const toWalletId = req.body.toWalletId;

      // Transfer or Savings with destination wallet (wallet-to-wallet transfer)
      if (transactionType === 'transfer' || transactionType === 'savings' || (category === 'Savings' && toWalletId)) {
        if (wallet && toWalletId) {
          const previousSourceBalance = wallet.balance;
          // Deduct from Source
          wallet.balance -= actual;
          await wallet.save();

          // Log source wallet deduction
          await AuditLogModel.create({
            userId,
            entityType: 'wallet',
            entityId: walletId,
            entityName: wallet.name,
            changeType: 'balance_change',
            previousBalance: previousSourceBalance,
            newBalance: wallet.balance,
            changeAmount: -actual,
            reason: `Transfer to another wallet: ${transaction.name}`,
            details: JSON.stringify({ transactionId: transaction.id, type: 'transfer_out' })
          });

          // Add to Target
          const toWallet = await WalletModel.findOne({ _id: toWalletId, userId });
          if (toWallet) {
            const previousTargetBalance = toWallet.balance;
            toWallet.balance += actual;
            await toWallet.save();

            // Log destination wallet addition
            await AuditLogModel.create({
              userId,
              entityType: 'wallet',
              entityId: toWalletId,
              entityName: toWallet.name,
              changeType: 'balance_change',
              previousBalance: previousTargetBalance,
              newBalance: toWallet.balance,
              changeAmount: actual,
              reason: `Transfer from ${wallet.name}: ${transaction.name}`,
              details: JSON.stringify({ transactionId: transaction.id, type: 'transfer_in' })
            });
          }
        }
      } else if (category === 'Savings' && goalId && !toWalletId) {
        // Goal savings without destination wallet - just deduct from source wallet
        // The money is being saved towards a goal (not transferred to another wallet)
        if (wallet) {
          const previousBalance = wallet.balance;
          wallet.balance -= actual;
          await wallet.save();

          // Log wallet deduction for goal savings
          await AuditLogModel.create({
            userId,
            entityType: 'wallet',
            entityId: walletId,
            entityName: wallet.name,
            changeType: 'balance_change',
            previousBalance,
            newBalance: wallet.balance,
            changeAmount: -actual,
            reason: `Goal savings: ${transaction.name}`,
            details: JSON.stringify({ transactionId: transaction.id, goalId, type: 'goal_savings' })
          });
        }
      } else {
        // Standard Expense/Income
        if (wallet) {
          const previousBalance = wallet.balance;
          const isIncome = ['income', 'Paycheck', 'Bonus', 'Debt Added'].includes(category) || transactionType === 'income';
          if (isIncome) {
            wallet.balance += actual;
          } else {
            wallet.balance -= actual;
          }
          await wallet.save();

          // Log wallet balance change for expense/income
          await AuditLogModel.create({
            userId,
            entityType: 'wallet',
            entityId: walletId,
            entityName: wallet.name,
            changeType: 'balance_change',
            previousBalance,
            newBalance: wallet.balance,
            changeAmount: isIncome ? actual : -actual,
            reason: `${isIncome ? 'Income' : 'Expense'}: ${transaction.name}`,
            details: JSON.stringify({ transactionId: transaction.id, category, type: isIncome ? 'income' : 'expense' })
          });
        }
      }
    }

    // Propagate Rollover Changes
    await recalculateRollovers(targetMonth, targetYear, userId);

    // Handle goal deductions (when withdrawing from savings wallet)
    const goalDeductions = req.body.goalDeductions as { goalId: string; amount: number }[] | undefined;
    if (goalDeductions && goalDeductions.length > 0) {
      const { Goal } = await import("../models/Goal");

      for (const deduction of goalDeductions) {
        const goal = await Goal.findOne({ _id: deduction.goalId, userId });
        if (goal) {
          // Reduce currentAmount, clamped at 0
          goal.currentAmount = Math.max(0, goal.currentAmount - deduction.amount);
          await goal.save();
          console.log(`[Goal Deduction] Deducted ${deduction.amount} from goal "${goal.name}". New amount: ${goal.currentAmount}`);
        }
      }
    }

    // Log to audit trail
    const { AuditLogModel } = await import("../models/WalletAuditLog");
    await AuditLogModel.create({
      userId,
      entityType: 'transaction',
      entityId: transaction.id,
      entityName: transaction.name,
      changeType: 'transaction_created',
      changeAmount: transaction.actual,
      details: `Created ${transaction.type} transaction: ${transaction.category} - $${transaction.actual}`
    });

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
    const oldWalletId = transaction.walletId;
    const oldAmount = transaction.actual;
    const oldCategory = transaction.category;
    const oldType = transaction.type || 'expense';
    const oldToWalletId = transaction.toWalletId;

    // Check if we need to move the transaction (date change check)
    let targetMonth = month as string;
    let targetYear = parseInt(year as string);
    const newDate = req.body.date;

    if (newDate) {
      // Parse date string directly to avoid timezone issues
      const dateParts = newDate.split('-');
      targetYear = parseInt(dateParts[0], 10);
      const targetMonthIndex = parseInt(dateParts[1], 10) - 1;
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      targetMonth = monthNames[targetMonthIndex];
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
      if (req.body.timestamp !== undefined) updatedTransaction.timestamp = req.body.timestamp;
      if (req.body.goalId !== undefined) updatedTransaction.goalId = req.body.goalId;
      if (req.body.walletId !== undefined) updatedTransaction.walletId = req.body.walletId;
      if (req.body.type !== undefined) updatedTransaction.type = req.body.type;
      if (req.body.toWalletId !== undefined) updatedTransaction.toWalletId = req.body.toWalletId;

      targetBudget.transactions.push(updatedTransaction as Transaction);
      targetBudget.markModified('transactions');
      await targetBudget.save();

      if (updatedTransaction.goalId) goalsToUpdate.add(updatedTransaction.goalId);

    } else {
      // Same bucket, update in place
      if (name !== undefined) transaction.name = name;
      if (planned !== undefined) transaction.planned = planned;
      if (actual !== undefined) transaction.actual = actual;
      if (req.body.category !== undefined) transaction.category = req.body.category;
      if (req.body.date !== undefined) transaction.date = req.body.date;
      if (req.body.timestamp !== undefined) transaction.timestamp = req.body.timestamp;
      if (req.body.goalId !== undefined) transaction.goalId = req.body.goalId;
      if (req.body.walletId !== undefined) transaction.walletId = req.body.walletId;
      if (req.body.type !== undefined) transaction.type = req.body.type;
      if (req.body.toWalletId !== undefined) transaction.toWalletId = req.body.toWalletId;



      sourceBudget.markModified('transactions');
      await sourceBudget.save();

      if (transaction.goalId) goalsToUpdate.add(transaction.goalId);
    }

    // Recalculate Goals
    for (const gid of goalsToUpdate) {
      await recalculateGoalTotal(gid, userId);
    }

    const newWalletId = req.body.walletId !== undefined ? req.body.walletId : oldWalletId;
    const newAmount = actual !== undefined ? actual : oldAmount;
    const newCategory = req.body.category !== undefined ? req.body.category : oldCategory;

    // --- Wallet Update Logic (Refactored for Transfers) ---

    // 1. REVERT OLD (Undo the effect of the previous transaction state)
    if (oldWalletId) {
      const { WalletModel } = await import("../models/Wallet");
      const w = await WalletModel.findOne({ _id: oldWalletId, userId });

      if ((oldType === 'transfer' || oldType === 'savings' || oldCategory === 'Savings') && oldToWalletId) {
        // Revert Transfer/Savings: Add back to Source, Subtract from Target
        if (w) {
          w.balance += oldAmount;
          await w.save();
        }
        const targetW = await WalletModel.findOne({ _id: oldToWalletId, userId });
        if (targetW) {
          targetW.balance -= oldAmount;
          await targetW.save();
        }
      } else {
        // Revert Standard (Expense/Income)
        if (w) {
          // If it was Savings but lacked toWalletId (legacy), it was treated as expense.
          // But here we assume if it's Savings it should be treated as transfer logic?
          // CAUTION: Legacy savings might not have toWalletId.
          // If oldCategory === 'Savings' but !oldToWalletId, fall through to else block?
          // The condition `(oldType === 'transfer' || oldCategory === 'Savings') && oldToWalletId` handles this safely.
          // If no toWalletId, it goes to `else` block which adds back amount (since it was treated as expense).
          const wasIncome = ['income', 'Paycheck', 'Bonus', 'Debt Added'].includes(oldCategory) || oldType === 'income';
          if (wasIncome) w.balance -= oldAmount; else w.balance += oldAmount;
          await w.save();
        }
      }
    }

    // 2. APPLY NEW (Apply effect of new transaction state)
    const newType = req.body.type !== undefined ? req.body.type : oldType;
    const newToWalletId = req.body.toWalletId !== undefined ? req.body.toWalletId : oldToWalletId;

    if (newWalletId) {
      const { WalletModel } = await import("../models/Wallet");
      const w = await WalletModel.findOne({ _id: newWalletId, userId });

      if ((newType === 'transfer' || newType === 'savings' || newCategory === 'Savings') && newToWalletId) {
        // Apply Transfer/Savings: Deduct Source, Add Target
        if (w) {
          w.balance -= newAmount;
          await w.save();
        }
        const targetW = await WalletModel.findOne({ _id: newToWalletId, userId });
        if (targetW) {
          targetW.balance += newAmount;
          await targetW.save();
        }
      } else {
        // Apply Standard
        if (w) {
          const isIncome = ['income', 'Paycheck', 'Bonus', 'Debt Added'].includes(newCategory) || newType === 'income';
          if (isIncome) w.balance += newAmount; else w.balance -= newAmount;
          await w.save();
        }
      }

    }

    // Propagate Rollover Changes (Run for earliest relevant month)
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const m1Idx = months.indexOf(month as string);
    const m2Idx = months.indexOf(targetMonth);
    const y1 = parseInt(year as string);
    const y2 = targetYear;

    let startM = month as string;
    let startY = y1;

    if (y2 < y1 || (y2 === y1 && m2Idx < m1Idx)) {
      startM = targetMonth;
      startY = y2;
    }



    await recalculateRollovers(startM, startY, userId);

    // Log to audit trail
    const { AuditLogModel } = await import("../models/WalletAuditLog");
    await AuditLogModel.create({
      userId,
      entityType: 'transaction',
      entityId: transaction.id,
      entityName: transaction.name,
      changeType: 'transaction_updated',
      previousBalance: oldAmount,
      newBalance: newAmount,
      details: `Updated transaction: ${transaction.name} ($${oldAmount} → $${newAmount})`
    });

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
    const deletedWalletId = transaction.walletId;
    const deletedAmount = transaction.actual;
    const deletedCategory = transaction.category;
    const deletedType = transaction.type || 'expense';
    const deletedToWalletId = transaction.toWalletId;

    budget.transactions.splice(index, 1);
    await budget.save();

    if (deletedGoalId) {
      await recalculateGoalTotal(deletedGoalId, userId);
    }

    if (deletedWalletId) {
      const { WalletModel } = await import("../models/Wallet");

      if ((deletedType === 'transfer' || deletedType === 'savings' || deletedCategory === 'Savings') && deletedToWalletId) {
        // Revert Transfer/Savings: Add back to Source, Subtract from Target
        const w = await WalletModel.findOne({ _id: deletedWalletId, userId });
        if (w) {
          const previousBalance = w.balance;
          w.balance += deletedAmount;
          await w.save();

          // Log source wallet revert
          await AuditLogModel.create({
            userId,
            entityType: 'wallet',
            entityId: deletedWalletId,
            entityName: w.name,
            changeType: 'balance_change',
            previousBalance,
            newBalance: w.balance,
            changeAmount: deletedAmount,
            reason: `Transfer reversed (deleted): ${transaction.name}`,
            details: JSON.stringify({ transactionId: transaction.id, type: 'transfer_deleted' })
          });
        }
        const targetW = await WalletModel.findOne({ _id: deletedToWalletId, userId });
        if (targetW) {
          const previousBalance = targetW.balance;
          targetW.balance -= deletedAmount;
          await targetW.save();

          // Log target wallet revert
          await AuditLogModel.create({
            userId,
            entityType: 'wallet',
            entityId: deletedToWalletId,
            entityName: targetW.name,
            changeType: 'balance_change',
            previousBalance,
            newBalance: targetW.balance,
            changeAmount: -deletedAmount,
            reason: `Transfer reversed (deleted): ${transaction.name}`,
            details: JSON.stringify({ transactionId: transaction.id, type: 'transfer_deleted' })
          });
        }
      } else {
        // Standard Revert
        const wallet = await WalletModel.findOne({ _id: deletedWalletId, userId });
        if (wallet) {
          const previousBalance = wallet.balance;
          const isIncome = ['income', 'Paycheck', 'Bonus', 'Debt Added'].includes(deletedCategory) || deletedType === 'income';
          if (isIncome) {
            wallet.balance -= deletedAmount;
          } else {
            wallet.balance += deletedAmount;
          }
          await wallet.save();

          // Log wallet balance revert
          await AuditLogModel.create({
            userId,
            entityType: 'wallet',
            entityId: deletedWalletId,
            entityName: wallet.name,
            changeType: 'balance_change',
            previousBalance,
            newBalance: wallet.balance,
            changeAmount: isIncome ? -deletedAmount : deletedAmount,
            reason: `${isIncome ? 'Income' : 'Expense'} deleted: ${transaction.name}`,
            details: JSON.stringify({ transactionId: transaction.id, category: deletedCategory, type: 'transaction_deleted' })
          });
        }
      }
    }





    await recalculateRollovers(month as string, parseInt(year as string), userId);

    // Create audit log for transaction deletion
    await AuditLogModel.create({
      userId,
      entityType: 'transaction',
      entityId: transaction.id,
      entityName: transaction.name,
      changeType: 'transaction_deleted',
      changeAmount: deletedAmount,
      details: JSON.stringify({
        category: deletedCategory,
        type: deletedType,
        date: transaction.date,
        walletId: deletedWalletId,
        month: month,
        year: year
      })
    });

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Revert goal fulfillment - delete the "Bought:" expense transaction and refund the savings wallet
export const revertGoalFulfillment: RequestHandler = async (req, res) => {
  const { goalId } = req.body;
  const userId = req.session?.user?.id;

  if (!goalId) {
    return res.status(400).json({ success: false, message: "Missing goalId" });
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    // Find all budgets for this user and search for the "Bought:" transaction for this goal
    const budgets = await Budget.find({ userId });

    let foundTransaction = null;
    let foundBudget = null;
    let transactionIndex = -1;

    for (const budget of budgets) {
      const idx = budget.transactions.findIndex(
        t => t.goalId === goalId && t.name.startsWith('Bought:') && t.type === 'expense'
      );
      if (idx !== -1) {
        foundTransaction = budget.transactions[idx];
        foundBudget = budget;
        transactionIndex = idx;
        break;
      }
    }

    if (!foundTransaction || !foundBudget) {
      // No purchase transaction found - goal might not have been fulfilled with a purchase
      return res.json({ success: true, message: "No purchase transaction to revert" });
    }

    const deletedWalletId = foundTransaction.walletId;
    const deletedAmount = foundTransaction.actual;
    const deletedCategory = foundTransaction.category;
    const deletedType = foundTransaction.type || 'expense';

    // Remove the transaction
    foundBudget.transactions.splice(transactionIndex, 1);
    await foundBudget.save();

    // Recalculate goal total
    await recalculateGoalTotal(goalId, userId);

    // Revert wallet balance (add the amount back to the wallet since it was an expense)
    if (deletedWalletId) {
      const { WalletModel } = await import("../models/Wallet");
      const wallet = await WalletModel.findOne({ _id: deletedWalletId, userId });
      if (wallet) {
        // For expense, refund the amount
        const isIncome = ['income', 'Paycheck', 'Bonus', 'Debt Added'].includes(deletedCategory) || deletedType === 'income';
        if (isIncome) {
          wallet.balance -= deletedAmount;
        } else {
          wallet.balance += deletedAmount; // Refund the expense
        }
        await wallet.save();
        console.log(`[RevertFulfillment] Refunded $${deletedAmount} to wallet ${wallet.name}`);
      }
    }

    // Recalculate rollovers
    await recalculateRollovers(foundBudget.month, foundBudget.year, userId);

    res.json({ success: true, data: foundTransaction, message: "Goal fulfillment reverted successfully" });
  } catch (error) {
    console.error("Error reverting goal fulfillment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const getYearlyStats: RequestHandler = async (req, res) => {
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
                "transactions.type": { $ne: 'transfer' },
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
                    $cond: [{
                      $and: [
                        { $not: { $in: ["$transactions.category", ['income', 'Paycheck', 'Bonus', 'Debt Added']] } },
                        { $ne: ["$transactions.category", "Savings"] },
                        { $ne: ["$transactions.type", "transfer"] },
                        { $ne: ["$transactions.category", "Transfer"] }
                      ]
                    }, "$transactions.actual", 0]
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
