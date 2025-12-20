
import "dotenv/config";
import mongoose from "mongoose";
import { Budget } from "./server/models/Budget";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/MBT";

async function checkRollover() {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: 'MBT', serverSelectionTimeoutMS: 5000 });
        console.log("Connected.");

        const budget = await Budget.findOne({}).sort({ year: -1, month: -1 }); // Get latest budget
        if (budget) {
            console.log(`Latest Budget: ${budget.month} ${budget.year}`);
            console.log(`Rollover Actual: ${budget.rolloverActual}`);
            console.log(`Rollover Planned: ${budget.rolloverPlanned}`);

            // Check previous budget
            // ... logic to find previous ...
        } else {
            console.log("No budgets found.");
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkRollover();
