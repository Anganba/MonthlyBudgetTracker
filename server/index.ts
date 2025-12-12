import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import { handleDemo } from "./routes/demo";
import { login, logout, getMe, register, updateProfile, updatePassword } from "./routes/auth";
import { requireAuth } from "./middleware/auth";
import {
  getBudget,
  updateBudget,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "./routes/budget";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
} from "./routes/goals";
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction
} from "./routes/recurring";

import { connectDB } from "./db";

export function createServer() {
  const app = express();

  // Connect to Database
  connectDB();

  // Trust proxy for Netlify (required for secure cookies)
  app.set("trust proxy", 1);

  // Middleware
  app.use(cors());
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
  app.post("/api/login", login);
  app.post("/api/register", register);
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
  app.get("/api/budget", requireAuth, getBudget);
  app.put("/api/budget", requireAuth, updateBudget);
  app.post("/api/budget/transaction", requireAuth, addTransaction);
  app.put("/api/budget/transaction", requireAuth, updateTransaction);
  app.delete("/api/budget/transaction", requireAuth, deleteTransaction);

  // Goals API routes
  app.get("/api/goals", requireAuth, getGoals);
  app.post("/api/goals", requireAuth, createGoal);
  app.put("/api/goals/:id", requireAuth, updateGoal);
  app.delete("/api/goals/:id", requireAuth, deleteGoal);

  // Recurring Transactions API routes
  app.get("/api/recurring", requireAuth, getRecurringTransactions);
  app.post("/api/recurring", requireAuth, createRecurringTransaction);
  app.put("/api/recurring/:id", requireAuth, updateRecurringTransaction);
  app.delete("/api/recurring/:id", requireAuth, deleteRecurringTransaction);

  return app;
}
