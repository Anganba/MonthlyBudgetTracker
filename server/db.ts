import mongoose from "mongoose";

let isConnected = false;
let connectionPromise: Promise<void> | null = null;

export const connectDB = async () => {
    if (isConnected) {
        return;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = (async () => {
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
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            isConnected = true;
            console.log("MongoDB connected successfully");

            // Drop legacy index if it exists to allow multi-user support
            try {
                const collections = await mongoose.connection.db?.listCollections({ name: 'budgets' }).toArray();
                if (collections && collections.length > 0) {
                    await mongoose.connection.collection('budgets').dropIndex('month_1_year_1');
                    console.log("Dropped legacy index month_1_year_1");
                }
            } catch (error) {
                // Ignore error if index doesn't exist or other issues, don't block startup
                console.log("Legacy index cleanup skipped or failed (non-critical)");
            }
        } catch (error) {
            console.error("MongoDB connection failed:", error);
            connectionPromise = null; // Reset promise on failure so we can retry
            throw error;
        }
    })();

    return connectionPromise;
};
