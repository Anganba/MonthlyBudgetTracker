
import "dotenv/config";
import mongoose from "mongoose";
import { WalletModel } from "./server/models/Wallet";
import { Budget } from "./server/models/Budget";
import { Transaction } from "./shared/api";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/MBT";

async function migrate() {
    try {
        console.log(`Connecting to DB...`);
        await mongoose.connect(MONGODB_URI, { dbName: 'MBT', serverSelectionTimeoutMS: 5000 });
        console.log("Connected.");

        // 1. Calculate Discrepancy
        const wallet = await WalletModel.findOne({});
        if (!wallet) {
            console.log("No wallets found.");
            process.exit(0);
        }
        const userId = wallet.userId;
        console.log(`User ID: ${userId}`);

        const wallets = await WalletModel.find({ userId });
        let totalWalletBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

        const budgets = await Budget.find({ userId });
        const allTransactions = budgets.flatMap(b => b.transactions);

        // Net Flow Calculation
        const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added'];
        let netFlow = 0;

        allTransactions.forEach(t => {
            const isIncome = incomeCategories.includes(t.category) || t.type === 'income';
            if (isIncome) {
                netFlow += t.actual;
            } else if (t.type !== 'transfer') {
                netFlow -= t.actual;
            }
        });

        const discrepancy = totalWalletBalance - netFlow;
        console.log(`Total Wallet Balance: $${totalWalletBalance}`);
        console.log(`Net Flow from Transactions: $${netFlow}`);
        console.log(`Discrepancy (Initial Balance): $${discrepancy}`);

        if (discrepancy <= 0) {
            console.log("No positive discrepancy found (or balance is lower than flow). No action needed.");
            process.exit(0);
        }

        // 2. Create Transaction
        console.log(`Creating transaction for $${discrepancy}...`);

        // Find "Cash" wallet or fallback to first
        const targetWallet = wallets.find(w => w.type === 'cash') || wallets[0];

        // Target Budget (Current Month)
        const date = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        let budget = await Budget.findOne({ userId, month, year });
        if (!budget) {
            console.log(`Creating budget for ${month} ${year}`);
            budget = await Budget.create({
                userId,
                month,
                year,
                transactions: [],
                rolloverPlanned: 0,
                rolloverActual: 0
            });
        }

        const newTransaction: Transaction = {
            id: new mongoose.Types.ObjectId().toString(), // Generate ID
            name: "Previous month's leftover",
            planned: 0, // Not planned
            actual: discrepancy,
            category: 'income', // Must be income to fix the equation
            date: date.toISOString(), // Today
            type: 'income',
            walletId: targetWallet.id
        };

        budget.transactions.push(newTransaction);
        await budget.save();
        console.log("Transaction added to budget.");

        // Note: We do NOT update the Wallet Balance because the money IS ALREADY THERE (that's why there is a discrepancy).
        // We are just adding the RECORD of it to the budget so flow matches stock.

        console.log("Migration Complete.");
        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

migrate();
