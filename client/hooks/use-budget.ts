
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BudgetMonth, Transaction } from "@shared/api";

export function useBudget(selectedMonth?: string, selectedYear?: number) {
    const queryClient = useQueryClient();
    const currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const month = selectedMonth || monthNames[currentDate.getMonth()];
    const year = selectedYear || currentDate.getFullYear();

    const fetchBudget = async (m: string, y: number) => {
        const response = await fetch(`/api/budget?month=${m}&year=${y}`);
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

    const { data: budget, isLoading: isLoadingCurrent } = useQuery({
        queryKey: ['budget', month, year],
        queryFn: () => fetchBudget(month, year),
        staleTime: 1000 * 60 * 5,
    });

    const { data: prevBudget } = useQuery({
        queryKey: ['budget', prevMonth, prevYear],
        queryFn: () => fetchBudget(prevMonth, prevYear),
        staleTime: 1000 * 60 * 5,
    });

    const calculateStats = (b: BudgetMonth | null | undefined) => {
        if (!b) return { income: 0, expenses: 0, savings: 0, balance: 0, transactions: [] };

        const transactions = b.transactions || [];
        const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added'];

        const income = transactions
            .filter(t => incomeCategories.includes(t.category))
            .reduce((sum, t) => sum + t.actual, 0);

        const expenses = transactions
            .filter(t => !incomeCategories.includes(t.category) && t.category !== 'Savings')
            .reduce((sum, t) => sum + t.actual, 0);

        const savings = transactions
            .filter(t => t.category === 'Savings')
            .reduce((sum, t) => sum + t.actual, 0);

        const startBalance = b.rolloverActual || 0;
        const balance = startBalance + income - expenses - savings;

        return { income, expenses, savings, balance, transactions };
    };

    const currentStats = calculateStats(budget);
    const prevStats = calculateStats(prevBudget);

    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
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
        let runningBalance = budget?.rolloverActual || 0;

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

            const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added'];

            if (type === 'balance') {
                const dayIncome = dailyTransactions
                    .filter(t => incomeCategories.includes(t.category))
                    .reduce((sum, t) => sum + t.actual, 0);
                const dayExpenses = dailyTransactions
                    .filter(t => !incomeCategories.includes(t.category) && t.category !== 'Savings')
                    .reduce((sum, t) => sum + t.actual, 0);
                const daySavings = dailyTransactions
                    .filter(t => t.category === 'Savings')
                    .reduce((sum, t) => sum + t.actual, 0);

                runningBalance = runningBalance + dayIncome - dayExpenses - daySavings;
                data.push({ value: runningBalance });

            } else {
                let value = 0;
                if (type === 'income') {
                    value = dailyTransactions
                        .filter(t => incomeCategories.includes(t.category))
                        .reduce((sum, t) => sum + t.actual, 0);
                } else if (type === 'expenses') {
                    value = dailyTransactions
                        .filter(t => !incomeCategories.includes(t.category) && t.category !== 'Savings')
                        .reduce((sum, t) => sum + t.actual, 0);
                } else if (type === 'savings') {
                    value = dailyTransactions
                        .filter(t => t.category === 'Savings')
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


    return {
        budget,
        isLoading: isLoadingCurrent,
        stats: {
            ...currentStats,
            startBalance: budget?.rolloverActual || 0
        },
        trends,
        graphs: {
            income: generateGraphData('income'),
            expenses: generateGraphData('expenses'),
            savings: generateGraphData('savings'),
            balance: generateGraphData('balance'),
        },
        refreshBudget: () => queryClient.invalidateQueries({ queryKey: ['budget', month, year] })
    };
}
