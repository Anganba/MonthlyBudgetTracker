
import "dotenv/config"; // Load .env file
import mongoose from "mongoose";
import { WalletModel } from "./server/models/Wallet";
import { Budget } from "./server/models/Budget";

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/MBT";

async function inspect() {
    try {
        console.log(`Connecting to ${MONGODB_URI.replace(/:([^:@]+)@/, ":****@")}...`);
        await mongoose.connect(MONGODB_URI, { dbName: 'MBT', serverSelectionTimeoutMS: 5000 });
        console.log("Connected to DB");

        // Get the first user
        const wallet = await WalletModel.findOne({});
        if (!wallet) {
            console.log("No wallets found. Checking Budgets...");
            const budget = await Budget.findOne({});
            if (!budget) {
                console.log("No data found at all.");
                process.exit(0);
            }
            console.log(`Found budget for user: ${budget.userId}`);
            // Proceed with budget user
            await analyzeUser(budget.userId);
            process.exit(0);
        }

        const userId = wallet.userId;
        await analyzeUser(userId);
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

async function analyzeUser(userId: string) {
    console.log("Inspecting for UserId:", userId);

    // 1. Get Wallet Balances
    const wallets = await WalletModel.find({ userId });
    let totalWalletBalance = 0;
    console.log("\n--- WALLETS ---");
    wallets.forEach(w => {
        console.log(`${w.name} (${w.type}): $${w.balance}`);
        totalWalletBalance += w.balance;
    });
    console.log(`TOTAL WALLET BALANCE: $${totalWalletBalance}`);

    // 2. Get All Transactions
    const budgets = await Budget.find({ userId });
    let totalIncome = 0;
    let totalExpense = 0;
    let netFlow = 0;

    console.log("\n--- TRANSACTION FLOW ---");

    const allTransactions = budgets.flatMap(b => b.transactions);
    console.log(`Total Transactions Found: ${allTransactions.length}`);

    const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added'];

    allTransactions.forEach(t => {
        const isIncome = incomeCategories.includes(t.category) || t.type === 'income';

        if (isIncome) {
            totalIncome += t.actual;
            netFlow += t.actual;
        } else {
            // Expense or Savings
            // If transfer generally they are net zero if we sum everything, 
            // but if we just look at "Income - Expense", transfers usually aren't counted unless they leave the system.
            // In our app, 'transfer' type transactions might double count if we aren't careful?
            // A transfer has: walletId (source) and toWalletId (target).
            // It should NOT be considered Income or Expense for "Net Worth" generally.
            // BUT if it's "Payment" type?
            if (t.type === 'transfer') {
                // Ignore for Net Flow Logic
            } else {
                totalExpense += t.actual;
                netFlow -= t.actual;
            }
        }
    });

    console.log(`Total Calculated Income: $${totalIncome}`);
    console.log(`Total Calculated Expense (inc Savings): $${totalExpense}`);
    console.log(`Net Flow (Income - Expense): $${netFlow}`);

    console.log(`\n--- DISCREPANCY ---`);
    const diff = totalWalletBalance - netFlow;
    console.log(`Total Wallets ($${totalWalletBalance}) - Net Flow ($${netFlow}) = $${diff}`);

    if (diff !== 0) {
        console.log("\nPossible Causes:");
        console.log("1. Initial Wallet Balances (money you had before starting tracking).");
        console.log("2. Transactions deleted from one side but not the other (bug).");
        console.log("3. Manual edits to Wallet Balance/Rollover.");
    }
}

inspect();
