
import mongoose from 'mongoose';
import { Budget } from './server/models/Budget';

async function recalculate() {
    try {
        await mongoose.connect('mongodb://0.0.0.0:27017/budget-tracker');
        console.log('Connected to DB');

        // Find the user (assuming single user or we pick the first one from budgets)
        const budget = await Budget.findOne();
        if (!budget) {
            console.log("No budgets found.");
            return;
        }
        const userId = budget.userId;
        console.log("Fixing for userId:", userId);

        // We implement the same logic as in backend
        const recalculateRollovers = async (startMonth: string, startYear: number, userId: string) => {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            let currentMonthIndex = months.indexOf(startMonth);
            let currentYear = startYear;

            let loopCount = 0;
            while (loopCount < 36) {
                const currentMonthName = months[currentMonthIndex];
                console.log(`Processing ${currentMonthName} ${currentYear}`);

                const budget = await Budget.findOne({ userId, month: currentMonthName, year: currentYear });
                if (!budget) {
                    console.log("Budget not found, stopping.");
                    break;
                }

                const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added'];
                const income = budget.transactions
                    .filter(t => incomeCategories.includes(t.category))
                    .reduce((sum, t) => sum + t.actual, 0);

                const expenses = budget.transactions
                    .filter(t => !incomeCategories.includes(t.category) && t.category !== 'Savings' && t.category !== 'Transfer' && t.type !== 'transfer')
                    .reduce((sum, t) => sum + t.actual, 0);

                const savings = budget.transactions
                    .filter(t => t.category === 'Savings')
                    .reduce((sum, t) => sum + t.actual, 0);

                const startBalance = budget.rolloverActual || 0;
                const endBalance = startBalance + income - expenses - savings;

                console.log(`  Start: ${startBalance}, Inc: ${income}, Exp: ${expenses}, Sav: ${savings} => End: ${endBalance}`);

                // Next Month
                let nextMonthIndex = currentMonthIndex + 1;
                let nextYear = currentYear;
                if (nextMonthIndex > 11) {
                    nextMonthIndex = 0;
                    nextYear++;
                }
                const nextMonthName = months[nextMonthIndex];

                const nextBudget = await Budget.findOne({ userId, month: nextMonthName, year: nextYear });
                if (nextBudget) {
                    if (nextBudget.rolloverActual !== endBalance) {
                        console.log(`  [UPDATE] Updating ${nextMonthName} ${nextYear} rollover from ${nextBudget.rolloverActual} to ${endBalance}`);
                        nextBudget.rolloverActual = endBalance;
                        await nextBudget.save();
                    } else {
                        console.log(`  [OK] ${nextMonthName} ${nextYear} rollover is correct.`);
                    }
                } else {
                    console.log("Next budget does not exist.");
                    break;
                }

                currentMonthIndex = nextMonthIndex;
                currentYear = nextYear;
                loopCount++;
            }
        };

        // Start from November 2025 (or earlier if needed, but issue seems recent)
        // Actually, let's start from a known good point or just a few months back.
        // User mentioned stale data for Dec from Nov.
        await recalculateRollovers('November', 2025, userId);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

recalculate();
