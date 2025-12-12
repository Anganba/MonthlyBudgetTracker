
import React from 'react';

interface TopStatsProps {
    startBalance: number;
    endBalance: number;
    savingsIncrease: number; // Percentage
    totalSavings: number;
    currency: string;
}

const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        BDT: '৳',
    };
    return symbols[currency] || '$';
};

export function TopStats({ startBalance, endBalance, savingsIncrease, totalSavings, currency }: TopStatsProps) {
    const symbol = getCurrencySymbol(currency);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full">
            {/* Balance Card */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center">
                <div className="flex items-end gap-6 mb-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-16 bg-muted rounded-t-lg"></div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Start</span>
                        <span className="text-sm font-semibold">{symbol}{startBalance}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-28 bg-primary rounded-t-lg shadow-md shadow-primary/20"></div>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">End</span>
                        <span className="text-sm font-semibold text-primary">{symbol}{endBalance.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Savings Stats Card */}
            <div className="bg-gradient-to-br from-sidebar-accent/50 to-sidebar-background p-6 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                <div className="text-center z-10">
                    <h3 className="text-4xl font-serif font-bold text-primary mb-1">+{savingsIncrease}%</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Increase in total savings</p>

                    <div className="border-t border-border w-16 mx-auto my-3"></div>

                    <h4 className="text-2xl font-serif font-bold text-foreground">{symbol}{totalSavings.toLocaleString()}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Saved this month</p>
                </div>
            </div>
        </div>
    );
}
