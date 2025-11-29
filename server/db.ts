import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
    if (isConnected) {
        return;
    }

    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.warn("MONGODB_URI is not defined.");
            return;
        }

        // Log masked URI for debugging
        const maskedUri = uri.replace(/:([^:@]+)@/, ":****@");
        console.log(`Connecting to MongoDB: ${maskedUri}`);

        if (mongoose.connection.readyState >= 1) {
            isConnected = true;
            return;
        }

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of 30s
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        // Do NOT exit process, as it kills the Lambda container.
        // Let the request fail with a proper error message.
    }
};
