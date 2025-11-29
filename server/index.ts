import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import { handleDemo } from "./routes/demo";
import { login, logout, getMe } from "./routes/auth";
import { requireAuth } from "./middleware/auth";
import {
  getBudget,
  updateBudget,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "./routes/budget";

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

  // Session Configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "fusion-starter-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production", // true in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Auth Routes
  app.post("/api/login", login);
  app.post("/api/logout", logout);
  app.get("/api/me", getMe);

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

  return app;
}
