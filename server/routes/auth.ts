import { RequestHandler } from "express";
import bcrypt from "bcryptjs";

// Default credentials - should be overridden by env vars
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
// Hash for "password" - generated for default safety
// In a real app, we'd hash the env var on startup or compare against a DB
const DEFAULT_PASSWORD_HASH = "$2a$10$xVv.x.x.x.x.x.x.x.x.x.x"; // Placeholder, we'll compare plain text if env var is set, or hash on fly

export const login: RequestHandler = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    const envUsername = process.env.ADMIN_USERNAME || "admin";
    const envPassword = process.env.ADMIN_PASSWORD || "password";

    if (username === envUsername) {
        // For simplicity with env vars, we'll do a direct comparison or hash comparison
        // Ideally, we hash the input and compare, or compare against a stored hash
        // Here we just compare plain text for the MVP as per plan
        const isValid = password === envPassword; // Simple check for MVP

        if (isValid) {
            if (req.session) {
                req.session.user = { id: "1", username: envUsername };
                return res.json({ success: true, user: req.session.user });
            }
        }
    }

    return res.status(401).json({ success: false, message: "Invalid credentials" });
};

export const logout: RequestHandler = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Could not log out" });
        }
        res.json({ success: true, message: "Logged out" });
    });
};

export const getMe: RequestHandler = (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ success: true, user: req.session.user });
    }
    return res.status(401).json({ success: false, message: "Not authenticated" });
};
