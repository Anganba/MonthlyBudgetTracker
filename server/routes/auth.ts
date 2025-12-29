import { RequestHandler } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";

export const login: RequestHandler = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    try {
        // Find user by username
        const user = await User.findOne({ username });

        if (!user) {
            console.log(`[Login] User ${username} not found.`);
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        console.log(`[Login] User ${username} found. Comparing password...`);
        console.log(`[Login] Hash length: ${user.passwordHash?.length || 0}`);

        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.passwordHash);
            console.log(`[Login] Password match result: ${isMatch}`);
        } catch (err) {
            console.error(`[Login] Bcrypt compare error:`, err);
        }

        // Fallback: Check for legacy plain-text password
        if (!isMatch && user.passwordHash === password) {
            console.log(`Migrating user ${user.username} to hashed password.`);
            const newHash = await bcrypt.hash(password, 10);
            user.passwordHash = newHash;
            await user.save();
            isMatch = true;
        }

        if (isMatch) {
            if (req.session) {
                console.log(`[Login] User ${username} authenticated. Creating session.`);
                req.session.user = {
                    id: (user._id as any).toString(),
                    username: user.username,
                    email: user.email
                };

                req.session.save((err) => {
                    if (err) {
                        console.error("[Login] Session save error:", err);
                        return res.status(500).json({ success: false, message: "Session save failed" });
                    }
                    console.log(`[Login] Session saved for ${username}.`);
                    res.json({ success: true, user: req.session.user });
                });
                return;
            } else {
                console.error("[Login] Critical Error: req.session is undefined!");
                return res.status(500).json({ success: false, message: "Server session error" });
            }
        }

        console.log(`[Login] Password mismatch for ${username}`);
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
    let { email } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    // Convert empty email to null to avoid unique index issues
    if (!email || email.trim() === '') {
        email = null;
    }

    try {
        // Check for duplicate username
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ success: false, message: "This username is already taken. Please choose a different username." });
        }

        // Check for duplicate email (only if email is provided)
        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ success: false, message: "This email address is already registered. Please use a different email or try logging in." });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email: email || undefined, // Use undefined instead of null for optional fields
            passwordHash: hashedPassword,
        });

        if (req.session) {
            req.session.user = {
                id: (user._id as any).toString(),
                username: user.username,
                email: user.email
            };
        }

        res.json({ success: true, user: { id: (user._id as any).toString(), username: user.username, email: user.email } });
    } catch (error: any) {
        console.error("Registration error:", error);

        // Handle MongoDB duplicate key errors (E11000)
        if (error.code === 11000 || error.message?.includes('E11000')) {
            // Parse which field caused the duplicate
            if (error.message?.includes('username')) {
                return res.status(400).json({
                    success: false,
                    message: "This username is already taken. Please choose a different username."
                });
            } else if (error.message?.includes('email')) {
                return res.status(400).json({
                    success: false,
                    message: "This email address is already registered. Please use a different email or try logging in."
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "An account with these credentials already exists. Please try different details."
                });
            }
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Invalid input data. Please check your information and try again."
            });
        }

        // Generic error fallback
        return res.status(500).json({
            success: false,
            message: "An error occurred during registration. Please try again later."
        });
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

export const updateProfile: RequestHandler = async (req, res) => {
    const { username, email } = req.body;
    console.log("Update Profile Request:", req.body);
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        if (username) {
            const existing = await User.findOne({ username, _id: { $ne: userId } });
            if (existing) return res.status(400).json({ success: false, message: "Username taken" });
        }
        if (email) {
            const existing = await User.findOne({ email, _id: { $ne: userId } });
            if (existing) return res.status(400).json({ success: false, message: "Email taken" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (username) user.username = username;
        if (email) user.email = email;

        await user.save();
        console.log("User Saved:", user);

        if (req.session) {
            req.session.user = { id: userId, username: user.username, email: user.email };
            await new Promise<void>((resolve, reject) => {
                req.session!.save((err) => err ? reject(err) : resolve());
            });
        }

        res.json({ success: true, user: req.session?.user });
    } catch (error: any) {
        console.error("Update profile error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePassword: RequestHandler = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        let isMatch = await bcrypt.compare(currentPassword, user.passwordHash).catch(() => false);

        // Fallback: Check for legacy plain-text
        if (!isMatch && user.passwordHash === currentPassword) {
            isMatch = true;
        }

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect current password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.passwordHash = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Password updated" });
    } catch (error: any) {
        console.error("Update password error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
