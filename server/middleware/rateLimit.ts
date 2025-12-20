import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// Clean up expired entries every 10 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const key in store) {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    }
}, 10 * 60 * 1000);

export const rateLimit = (
    windowMs: number = 15 * 60 * 1000, // Default 15 minutes
    max: number = 100 // Default 100 requests per window
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || req.socket.remoteAddress || "unknown";
        const now = Date.now();

        if (!store[ip]) {
            store[ip] = {
                count: 1,
                resetTime: now + windowMs
            };
        } else {
            if (now > store[ip].resetTime) {
                // Window expired, reset
                store[ip] = {
                    count: 1,
                    resetTime: now + windowMs
                };
            } else {
                store[ip].count++;
            }
        }

        if (store[ip].count > max) {
            const timeLeft = Math.ceil((store[ip].resetTime - now) / 1000) || 1;
            res.setHeader("Retry-After", timeLeft);
            return res.status(429).json({
                success: false,
                message: `Too many requests. Please try again in ${Math.ceil(timeLeft / 60)} minutes.`
            });
        }

        next();
    };
};
