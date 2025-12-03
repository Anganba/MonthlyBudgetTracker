import { RequestHandler } from "express";
import mongoose from "mongoose";
import { User } from "../models/User";

export const login: RequestHandler = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    try {
        // Find user by username
        let user = await User.findOne({ username });

        // If no user exists, check if it matches the env var admin credentials
        // If so, create the user in the DB for future persistence
        const envUsername = process.env.ADMIN_USERNAME || "admin";
        const envPassword = process.env.ADMIN_PASSWORD || "password";

        if (!user && username === envUsername && password === envPassword) {
            user = await User.create({
                username: envUsername,
                passwordHash: envPassword, // In a real app, hash this!
            });
        }

        if (user && user.passwordHash === password) {
            if (req.session) {
                req.session.user = { id: (user._id as any).toString(), username: user.username };

                return new Promise((resolve, reject) => {
                    req.session.save((err) => {
                        if (err) {
                            return reject(res.status(500).json({ success: false, message: "Session save failed" }));
                        }
                        resolve(res.json({ success: true, user: req.session.user }));
                    });
                });
            }
        }

        return res.status(401).json({ success: false, message: "Invalid credentials" });
    } catch (error: any) {
        console.error("Login error:", error);

        const state = mongoose.connection.readyState;
        const states = ["disconnected", "connected", "connecting", "disconnecting"];
        const stateName = states[state] || "unknown";

        return res.status(500).json({
            success: false,
            message: `Login error: ${error.message}. DB State: ${stateName} (${state})`
        });
    }
};

export const register: RequestHandler = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username already exists" });
        }

        const user = await User.create({
            username,
            passwordHash: password, // In a real app, hash this!
        });

        if (req.session) {
            req.session.user = { id: (user._id as any).toString(), username: user.username };
        }

        res.json({ success: true, user: { id: (user._id as any).toString(), username: user.username } });
    } catch (error: any) {
        console.error("Registration error:", error);
        return res.status(500).json({ success: false, message: `Registration error: ${error.message}` });
    }
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
