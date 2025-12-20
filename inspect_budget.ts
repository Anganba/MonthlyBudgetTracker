
import mongoose from 'mongoose';
import { Budget } from './server/models/Budget';
import { WalletModel } from './server/models/Wallet';

async function inspect() {
    try {
        await mongoose.connect('mongodb://0.0.0.0:27017/budget-tracker');
        console.log('Connected to DB');

        const budgets = await Budget.find({}).sort({ year: 1, month: 1 });
        console.log(`Found ${budgets.length} budgets.`);

        for (const b of budgets) {
            console.log(`\nBudget: ${b.month} ${b.year} (User: ${b.userId})`);
            console.log(`Rollover Actual: ${b.rolloverActual}`);

            const income = b.transactions
                .filter(t => ['income', 'Paycheck', 'Bonus', 'Debt Added'].includes(t.category))
                .reduce((sum, t) => sum + t.actual, 0);

            const expenses = b.transactions
                .filter(t => !['income', 'Paycheck', 'Bonus', 'Debt Added'].includes(t.category) && t.category !== 'Savings' && t.type !== 'transfer')
                .reduce((sum, t) => sum + t.actual, 0);

            const savings = b.transactions
                .filter(t => t.category === 'Savings')
                .reduce((sum, t) => sum + t.actual, 0);

            console.log(`Income: ${income}, Expenses: ${expenses}, Savings: ${savings}`);
            console.log(`Calculated Ending Balance: ${b.rolloverActual + income - expenses - savings}`);
        }

        const wallets = await WalletModel.find({});
        console.log('\nWallets:');
        wallets.forEach(w => {
            console.log(`${w.name} (${w.type}): ${w.balance}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
