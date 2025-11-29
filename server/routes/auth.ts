import { RequestHandler } from "express";
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
                return res.json({ success: true, user: req.session.user });
            }
        }

        return res.status(401).json({ success: false, message: "Invalid credentials" });
    } catch (error: any) {
        console.error("Login error:", error);
        // Return the actual error message for debugging purposes
        return res.status(500).json({ success: false, message: `Login error: ${error.message}` });
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
