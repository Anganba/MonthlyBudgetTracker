import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import { handleDemo } from "./routes/demo";
import { login, logout, getMe, register, updateProfile, updatePassword } from "./routes/auth";
import { requireAuth } from "./middleware/auth";
import { rateLimit } from "./middleware/rateLimit";
import {
  getBudget,
  updateBudget,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getYearlyStats,
  getMonthlyStats,
  getAllTransactions,
  revertGoalFulfillment,
  getFrequentCategories,
  getAllUsedCategories,
} from "./routes/budget";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  resetGoalProgress
} from "./routes/goals";
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction
} from "./routes/recurring";
import {
  getWallets,
  createWallet,
  updateWallet,
  deleteWallet,
  getWalletAuditLogs,
  getUserAuditLogs,
  logDataExport,
  reorderWallets
} from "./routes/wallets";
import {
  getLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  addLoanPayment,
  removeLoanPayment
} from "./routes/loans";

import { connectDB } from "./db";

export function createServer() {
  const app = express();

  // Connect to Database
  connectDB();

  // Trust proxy for Netlify (required for secure cookies)
  app.set("trust proxy", 1);

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === "production" ? false : "*", // In production, same-origin only (false) or strict whitelist. Dev allows all.
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  // Session Configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "fusion-starter-secret",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        dbName: 'MBT',
        ttl: 24 * 60 * 60, // 1 day
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production" && process.env.NETLIFY === "true", // Only secure on Netlify/Production HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );



  // Auth Routes
  const authLimiter = rateLimit(15 * 60 * 1000, 10); // 10 requests per 15 minutes for auth to prevent brute force
  app.post("/api/login", authLimiter, login);
  app.post("/api/register", authLimiter, register);
  app.post("/api/logout", logout);
  app.get("/api/me", getMe);
  app.put("/api/profile", requireAuth, updateProfile);
  app.put("/api/profile/password", requireAuth, updatePassword);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Budget API routes - Protected
  app.get("/api/budget/all", requireAuth, getAllTransactions);
  app.get("/api/budget/frequent-categories", requireAuth, getFrequentCategories);
  app.get("/api/budget/used-categories", requireAuth, getAllUsedCategories);
  app.get("/api/budget", requireAuth, getBudget);
  app.get("/api/budget/year", requireAuth, getYearlyStats);
  app.get("/api/budget/month-stats", requireAuth, getMonthlyStats);
  app.put("/api/budget", requireAuth, updateBudget);
  app.post("/api/budget/transaction", requireAuth, addTransaction);
  app.put("/api/budget/transaction", requireAuth, updateTransaction);
  app.delete("/api/budget/transaction", requireAuth, deleteTransaction);

  // Goals API routes
  app.get("/api/goals", requireAuth, getGoals);
  app.post("/api/goals", requireAuth, createGoal);
  app.put("/api/goals/:id", requireAuth, updateGoal);
  app.delete("/api/goals/:id", requireAuth, deleteGoal);
  app.post("/api/goals/revert-fulfillment", requireAuth, revertGoalFulfillment);
  app.post("/api/goals/reset-progress", requireAuth, resetGoalProgress);

  // Recurring Transactions API routes
  app.get("/api/recurring", requireAuth, getRecurringTransactions);
  app.post("/api/recurring", requireAuth, createRecurringTransaction);
  app.put("/api/recurring/:id", requireAuth, updateRecurringTransaction);
  app.delete("/api/recurring/:id", requireAuth, deleteRecurringTransaction);

  // Wallets API routes
  app.get("/api/wallets", requireAuth, getWallets);
  app.post("/api/wallets", requireAuth, createWallet);
  app.put("/api/wallets/reorder", requireAuth, reorderWallets);
  app.put("/api/wallets/:id", requireAuth, updateWallet);
  app.delete("/api/wallets/:id", requireAuth, deleteWallet);

  // Wallet Audit Logs API routes
  app.get("/api/wallets/:id/audit-logs", requireAuth, getWalletAuditLogs);
  app.get("/api/audit-logs", requireAuth, getUserAuditLogs);
  app.post("/api/audit-logs/export", requireAuth, logDataExport);

  // Loans API routes
  app.get("/api/loans", requireAuth, getLoans);
  app.post("/api/loans", requireAuth, createLoan);
  app.put("/api/loans/:id", requireAuth, updateLoan);
  app.delete("/api/loans/:id", requireAuth, deleteLoan);
  app.post("/api/loans/:id/payments", requireAuth, addLoanPayment);
  app.delete("/api/loans/:id/payments/:paymentId", requireAuth, removeLoanPayment);

  return app;
}
