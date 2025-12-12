import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BudgetMonth } from '@shared/api';

interface AnalyticsChartProps {
    budget: BudgetMonth;
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

export function AnalyticsChart({ budget, currency }: AnalyticsChartProps) {
    const symbol = getCurrencySymbol(currency);

    // Aggregate data by date (Day of month)
    // Assume date format is "YYYY-MM-DD" in t.date
    const dailyDataMap = new Map<number, { day: number; income: number; expense: number }>();

    // Initialize all days for the month? Or just days with data?
    // Let's just do days with data for now, or maybe range 1-End?
    // Better: Sort days present.

    budget.transactions.forEach((t) => {
        if (!t.date) return;
        const dateObj = new Date(t.date);
        const day = dateObj.getDate();

        if (!dailyDataMap.has(day)) {
            dailyDataMap.set(day, { day, income: 0, expense: 0 });
        }

        const entry = dailyDataMap.get(day)!;
        const isIncome = ['Paycheck', 'Bonus', 'Debt Added', 'income'].includes(t.category);

        if (isIncome) {
            entry.income += t.actual;
        } else {
            entry.expense += t.actual;
        }
    });

    const chartData = Array.from(dailyDataMap.values())
        .sort((a, b) => a.day - b.day);

    // Styling for Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover p-3 border border-border rounded shadow-md">
                    <p className="text-sm font-bold mb-2 text-popover-foreground">{`Day ${label}`}</p>
                    {payload.map((p: any) => (
                        <p key={p.name} className="text-xs" style={{ color: p.color }}>
                            {`${p.name}: ${symbol}${p.value.toLocaleString()}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-serif font-bold text-lg text-card-foreground">Income & Expenses Trend</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">This Month</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span>Income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span>Expense</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickMargin={10}
                        />
                        <YAxis
                            hide={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickFormatter={(val) => `${symbol}${val}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                        <Line
                            type="monotone"
                            dataKey="income"
                            name="Income"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="expense"
                            name="Expense"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            {chartData.length === 0 && (
                <div className="flex items-center justify-center h-full -mt-[300px] pb-10">
                    <p className="text-muted-foreground text-sm">No transaction data yet.</p>
                </div>
            )}
        </div>
    );
}
