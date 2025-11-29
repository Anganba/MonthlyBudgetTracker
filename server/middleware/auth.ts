import { Request, Response, NextFunction } from "express";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.user) {
        return next();
    }

    return res.status(401).json({ success: false, message: "Unauthorized" });
};

// Extend session types
declare module "express-session" {
    interface SessionData {
        user: {
            id: string;
            username: string;
        };
    }
}
