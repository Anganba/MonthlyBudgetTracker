
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BudgetMonth, Transaction } from "@shared/api";
import { useAuth } from "@/lib/auth";
import { useWallets } from "./use-wallets";

export function useBudget(selectedMonth?: string, selectedYear?: number) {
    const queryClient = useQueryClient();
    const currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const month = selectedMonth || monthNames[currentDate.getMonth()];
    const year = selectedYear || currentDate.getFullYear();
    const { wallets } = useWallets();

    const fetchBudget = async (m: string, y: number) => {
        const response = await fetch(`/api/budget?month=${m}&year=${y}&t=${new Date().getTime()}`);
        const result = await response.json();
        // Return null instead of throwing if budget doesn't exist, to handle new months gracefully
        if (!result.success) return null;
        return result.data as BudgetMonth;
    };

    const currentMonthIndex = monthNames.indexOf(month);
    const currentBudgetStart = new Date(year, currentMonthIndex);
    const prevDate = new Date(currentBudgetStart);
    prevDate.setMonth(currentBudgetStart.getMonth() - 1);
    const prevMonth = monthNames[prevDate.getMonth()];
    const prevYear = prevDate.getFullYear();

    const { user } = useAuth();
    const userId = user?.id;

    // Helper for caching
    const getCachedData = (key: string) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : undefined;
        } catch { return undefined; }
    };
    const setCachedData = (key: string, data: any) => {
        try {
            if (data) localStorage.setItem(key, JSON.stringify(data));
        } catch { }
    };

    // Cache keys
    const budgetKey = `budget-${month}-${year}-${userId}`;
    const prevBudgetKey = `budget-${prevMonth}-${prevYear}-${userId}`;
    const yearlyStatsKey = `yearlyStats-${year}-${userId}`;
    const monthlyStatsKey = `monthlyStats-${month}-${year}-${userId}`;

    const { data: budget, isLoading: isLoadingCurrent } = useQuery({
        queryKey: ['budget', month, year, userId],
        queryFn: () => fetchBudget(month, year),
        staleTime: 0, // Always fetch fresh data in background
        initialData: () => getCachedData(budgetKey),
        enabled: !!userId, // Only fetch if user is logged in
    });

    useEffect(() => {
        if (budget) setCachedData(budgetKey, budget);
    }, [budget, budgetKey]);

    const { data: prevBudget } = useQuery({
        queryKey: ['budget', prevMonth, prevYear, userId],
        queryFn: () => fetchBudget(prevMonth, prevYear),
        staleTime: 0,
        initialData: () => getCachedData(prevBudgetKey),
        enabled: !!userId,
    });

    useEffect(() => {
        if (prevBudget) setCachedData(prevBudgetKey, prevBudget);
    }, [prevBudget, prevBudgetKey]);

    const calculateStats = (b: BudgetMonth | null | undefined) => {
        if (!b) return { income: 0, expenses: 0, savings: 0, balance: 0, transactions: [] };

        const transactions = b.transactions || [];
        const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added', 'Side Hustle', 'Freelance', 'Gifts Received', 'Refund', 'Loan Repaid'];
        const savingsCategories = ['Investments']; // Treat these expenses as savings

        // Income: type='income' OR income categories
        const income = transactions
            .filter(t => t.type === 'income' || incomeCategories.includes(t.category))
            .reduce((sum, t) => sum + t.actual, 0);

        // Expenses: type='expense' AND not Savings/Transfer categories AND not transfer/savings types AND not savings categories
        const expenses = transactions
            .filter(t => {
                // Exclude transfers and savings types
                if (t.type === 'transfer' || t.type === 'savings') return false;
                // Exclude Transfer and Savings categories
                if (t.category === 'Transfer' || t.category === 'Savings') return false;
                // Exclude income
                if (t.type === 'income' || incomeCategories.includes(t.category)) return false;
                // Exclude savings categories (Investments)
                if (savingsCategories.includes(t.category)) return false;
                return true;
            })
            .reduce((sum, t) => sum + t.actual, 0);

        // Savings: type='savings' OR category='Savings' OR (type='transfer' AND toWallet is Savings) OR savings categories
        const savings = transactions
            .filter(t => {
                if (t.type === 'savings' || t.category === 'Savings') return true;
                if (savingsCategories.includes(t.category)) return true;
                if ((t.type === 'transfer' || t.category === 'Transfer') && t.toWalletId) {
                    const targetWallet = wallets.find(w => w.id === t.toWalletId);
                    return targetWallet?.isSavingsWallet === true;
                }
                return false;
            })
            .reduce((sum, t) => sum + t.actual, 0);

        // Monthly Leftover = just this month's: Income - Expenses - Savings
        // The actual accumulated money is tracked in wallet balances (Net Worth)
        const balance = income - expenses - savings;

        return { income, expenses, savings, balance, transactions };
    };

    const currentStats = calculateStats(budget);
    const prevStats = calculateStats(prevBudget);

    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / Math.abs(previous)) * 100);
    };

    const trends = {
        income: calculateTrend(currentStats.income, prevStats.income),
        expenses: calculateTrend(currentStats.expenses, prevStats.expenses),
        savings: calculateTrend(currentStats.savings, prevStats.savings),
        balance: calculateTrend(currentStats.balance, prevStats.balance),
    };

    // Generate graph data (daily cumulative for current month)
    const generateGraphData = (type: 'income' | 'expenses' | 'savings' | 'balance') => {
        const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
        const data = [];
        let runningBalance = 0; // Start at 0 for this month only (no rollover)

        for (let i = 1; i <= daysInMonth; i++) {
            // Find transactions for this day
            // Note: Date string in transaction might be YYYY-MM-DD
            const dayStr = i.toString().padStart(2, '0');
            // Assuming transaction date format is YYYY-MM-DD. We match the day part.
            // Filter transactions up to this day

            const dailyTransactions = currentStats.transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getDate() === i;
            });

            const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added', 'Side Hustle', 'Freelance', 'Gifts Received', 'Refund', 'Loan Repaid'];
            const savingsCategories = ['Investments'];

            if (type === 'balance') {
                // Income: type='income' OR income categories
                const dayIncome = dailyTransactions
                    .filter(t => t.type === 'income' || incomeCategories.includes(t.category))
                    .reduce((sum, t) => sum + t.actual, 0);

                // Expenses: Everything else except income, savings types, and transfers
                const dayExpenses = dailyTransactions
                    .filter(t => {
                        if (t.type === 'transfer' || t.type === 'savings') return false;
                        if (t.category === 'Transfer' || t.category === 'Savings') return false;
                        if (t.type === 'income' || incomeCategories.includes(t.category)) return false;
                        if (savingsCategories.includes(t.category)) return false;
                        return true;
                    })
                    .reduce((sum, t) => sum + t.actual, 0);

                // Savings: type='savings' OR category='Savings'
                // Savings: type='savings' OR category='Savings' OR (type='transfer' AND toWallet is Savings)
                const daySavings = dailyTransactions
                    .filter(t => {
                        if (t.type === 'savings' || t.category === 'Savings') return true;
                        if (savingsCategories.includes(t.category)) return true;
                        if ((t.type === 'transfer' || t.category === 'Transfer') && t.toWalletId) {
                            const targetWallet = wallets.find(w => w.id === t.toWalletId);
                            return targetWallet?.isSavingsWallet === true;
                        }
                        return false;
                    })
                    .reduce((sum, t) => sum + t.actual, 0);

                runningBalance = runningBalance + dayIncome - dayExpenses - daySavings;
                data.push({ value: runningBalance });

            } else {
                let value = 0;
                if (type === 'income') {
                    // Income: type='income' OR income categories
                    value = dailyTransactions
                        .filter(t => t.type === 'income' || incomeCategories.includes(t.category))
                        .reduce((sum, t) => sum + t.actual, 0);
                } else if (type === 'expenses') {
                    // Expenses: Everything else except income, savings types, and transfers
                    value = dailyTransactions
                        .filter(t => {
                            if (t.type === 'transfer' || t.type === 'savings') return false;
                            if (t.category === 'Transfer' || t.category === 'Savings') return false;
                            if (t.type === 'income' || incomeCategories.includes(t.category)) return false;
                            if (savingsCategories.includes(t.category)) return false;
                            return true;
                        })
                        .reduce((sum, t) => sum + t.actual, 0);
                } else if (type === 'savings') {
                    // Savings: type='savings' OR category='Savings'
                    // Savings: type='savings' OR category='Savings' OR (type='transfer' AND toWallet is Savings)
                    value = dailyTransactions
                        .filter(t => {
                            if (t.type === 'savings' || t.category === 'Savings') return true;
                            if (savingsCategories.includes(t.category)) return true;
                            if ((t.type === 'transfer' || t.category === 'Transfer') && t.toWalletId) {
                                const targetWallet = wallets.find(w => w.id === t.toWalletId);
                                return targetWallet?.isSavingsWallet === true;
                            }
                            return false;
                        })
                        .reduce((sum, t) => sum + t.actual, 0);
                }
                // For non-balance, maybe we want cumulative? Or daily peaks? 
                // Sparklines usually show trends. Cumulative is usually better for "Progress throughout the month".
                // But for expenses, daily spikes are interesting too. 
                // Let's go with Cumulative for smoother lines, or just daily sum if we want to show activity.
                // Inspecting the MetricCard mock data, it looks volatile. Let's do Cumulative.

                const prevValue = data.length > 0 ? data[data.length - 1].value : 0;
                data.push({ value: prevValue + value });
            }
        }
        return data;
    };


    const { data: yearlyStats, isLoading: isLoadingYearly } = useQuery({
        queryKey: ['yearlyStats', year, userId],
        queryFn: async () => {
            const response = await fetch(`/api/budget/year?year=${year}&t=${new Date().getTime()}`);
            const result = await response.json();
            if (!result.success) return [];
            return result.data as { name: string; expense: number }[];
        },
        staleTime: 0,
        initialData: () => getCachedData(yearlyStatsKey),
        enabled: !!userId,
    });

    useEffect(() => {
        if (yearlyStats) setCachedData(yearlyStatsKey, yearlyStats);
    }, [yearlyStats, yearlyStatsKey]);

    // New Monthly Stats Query (Optimized)
    const { data: monthlyStats, isLoading: isLoadingMonthlyStats } = useQuery({
        queryKey: ['monthlyStats', month, year, userId],
        queryFn: async () => {
            const response = await fetch(`/api/budget/month-stats?month=${month}&year=${year}&t=${new Date().getTime()}`);
            const result = await response.json();
            if (!result.success) return null;
            return result.data as { pieData: any[]; dailyData: any[]; startBalance: number };
        },
        staleTime: 0,
        initialData: () => getCachedData(monthlyStatsKey),
        enabled: !!userId,
    });

    useEffect(() => {
        if (monthlyStats) setCachedData(monthlyStatsKey, monthlyStats);
    }, [monthlyStats, monthlyStatsKey]);


    return {
        budget,
        prevBudget,
        isLoading: isLoadingCurrent,
        isLoadingYearly,
        stats: {
            ...currentStats,
            startBalance: budget?.rolloverActual || 0
        },
        prevStats,
        trends,
        graphs: {
            income: generateGraphData('income'),
            expenses: generateGraphData('expenses'),
            savings: generateGraphData('savings'),
            balance: generateGraphData('balance'),
        },
        yearlyStats: yearlyStats || [],
        monthlyStats,
        isLoadingMonthlyStats,
        refreshBudget: async () => {
            // Invalidate all budget-related queries to ensure consistency across months
            // This is crucial because a transaction in one month can affect rollovers in subsequent months
            await Promise.all([
                // Invalidate everything under 'budget' to catch other months' data 
                // (e.g. previous month's ending balance affecting this month's start)
                queryClient.invalidateQueries({ queryKey: ['budget'] }),
                queryClient.invalidateQueries({ queryKey: ['yearlyStats'] }),
                queryClient.invalidateQueries({ queryKey: ['monthlyStats'] }),
                // Also invalidate derived data that might be displayed elsewhere
                queryClient.invalidateQueries({ queryKey: ['goals'] }),
                queryClient.invalidateQueries({ queryKey: ['wallets'] })
            ]);
        }
    };
}
