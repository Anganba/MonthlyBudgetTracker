import React, { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useBudget } from "@/hooks/use-budget";
import { useGoals } from "@/hooks/use-goals";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
    LabelList,
    Label,
    RadialBarChart,
    RadialBar,
    ComposedChart,
    Line,
} from "recharts";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths, isSameMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Calendar, TrendingDown, TrendingUp, PieChart as PieChartIcon, Target, Wallet, Tags, ArrowRightLeft, DollarSign, Percent, BarChart3, ArrowUpRight, ArrowDownRight, Scale, Search, Table, BarChart2, Filter, X } from "lucide-react";
import { MetricCard } from "@/components/budget/MetricCard";
import { Progress } from "@/components/ui/progress";

import { useWallets } from "@/hooks/use-wallets";

export default function StatisticsPage() {
    const [date, setDate] = useState(new Date());
    const [xAxisMode, setXAxisMode] = useState<'daily' | 'weekly'>('daily');
    const [yAxisMode, setYAxisMode] = useState<'standard' | 'cumulative'>('standard');
    const [yAxisMax, setYAxisMax] = useState<string>('');

    // Yearly chart controls
    const [yearlyXAxisMode, setYearlyXAxisMode] = useState<'monthly' | 'quarterly'>('monthly');
    const [yearlyYAxisMax, setYearlyYAxisMax] = useState<string>('');

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthName = monthNames[date.getMonth()];
    const currentYear = date.getFullYear();

    const { budget, prevBudget, isLoading: isLoadingBudget, yearlyStats, isLoadingYearly, monthlyStats, isLoadingMonthlyStats, stats, prevStats, trends, graphs } = useBudget(currentMonthName, currentYear);
    const { wallets } = useWallets();

    const { goals, isLoading: isLoadingGoals } = useGoals();
    const currency = "$"; // consistent with app

    const [showIncome, setShowIncome] = useState(false);
    const [showExpense, setShowExpense] = useState(true);
    const [showTransfers, setShowTransfers] = useState(false);
    const [showNetWorth, setShowNetWorth] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedYearlyCategories, setSelectedYearlyCategories] = useState<string[]>([]);
    const [selectedMonthOverMonthCategories, setSelectedMonthOverMonthCategories] = useState<string[]>([]);

    const { user } = useAuth();
    const userId = user?.id;

    const handlePrevMonth = () => setDate(subMonths(date, 1));
    const handleNextMonth = () => setDate(addMonths(date, 1));

    // === Deep Dive Analysis State ===
    const defaultEndDate = new Date();
    const defaultStartDate = subMonths(defaultEndDate, 2);
    const [analysisStartMonth, setAnalysisStartMonth] = useState(monthNames[defaultStartDate.getMonth()]);
    const [analysisStartYear, setAnalysisStartYear] = useState(defaultStartDate.getFullYear());
    const [analysisEndMonth, setAnalysisEndMonth] = useState(monthNames[defaultEndDate.getMonth()]);
    const [analysisEndYear, setAnalysisEndYear] = useState(defaultEndDate.getFullYear());
    const [analysisType, setAnalysisType] = useState<'expense' | 'income' | 'transfer' | 'all'>('expense');
    const [analysisGroupBy, setAnalysisGroupBy] = useState<'category' | 'wallet' | 'month'>('category');
    const [analysisView, setAnalysisView] = useState<'chart' | 'table'>('chart');
    const [analysisCategories, setAnalysisCategories] = useState<string[]>([]);
    const [analysisWallets, setAnalysisWallets] = useState<string[]>([]);

    // Available years for the range picker
    const availableYears = useMemo(() => {
        const years: number[] = [];
        for (let y = currentYear - 5; y <= currentYear + 1; y++) years.push(y);
        return years;
    }, [currentYear]);

    // Fetch range data
    const { data: rangeData, isLoading: isLoadingRange } = useQuery({
        queryKey: ['rangeStats', analysisStartMonth, analysisStartYear, analysisEndMonth, analysisEndYear, userId],
        queryFn: async () => {
            const params = new URLSearchParams({
                startMonth: analysisStartMonth,
                startYear: String(analysisStartYear),
                endMonth: analysisEndMonth,
                endYear: String(analysisEndYear),
            });
            const res = await fetch(`/api/budget/range?${params}`);
            const json = await res.json();
            if (!json.success) return null;
            return json.data as {
                months: { month: string; year: number; categoryLimits: Record<string, number>; transactionCount: number }[];
                transactions: any[];
            };
        },
        enabled: !!userId,
        staleTime: 30000,
    });

    // Filter range transactions based on analysisType, categories, wallets
    const filteredRangeTransactions = useMemo(() => {
        if (!rangeData?.transactions) return [];
        const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added'];
        return rangeData.transactions.filter((t: any) => {
            // Type filter
            if (analysisType !== 'all') {
                if (analysisType === 'expense') {
                    if (incomeCategories.includes(t.category) || t.type === 'income' || t.type === 'transfer' || t.type === 'savings') return false;
                } else if (analysisType === 'income') {
                    if (!incomeCategories.includes(t.category) && t.type !== 'income') return false;
                } else if (analysisType === 'transfer') {
                    if (t.type !== 'transfer' && t.type !== 'savings') return false;
                }
            }
            // Category filter
            if (analysisCategories.length > 0 && !analysisCategories.includes(t.category)) return false;
            // Wallet filter
            if (analysisWallets.length > 0 && !analysisWallets.includes(t.walletId)) return false;
            return true;
        });
    }, [rangeData, analysisType, analysisCategories, analysisWallets]);

    // Available categories/wallets from range data
    const availableAnalysisCategories = useMemo(() => {
        if (!rangeData?.transactions) return [];
        const cats = new Set<string>();
        rangeData.transactions.forEach((t: any) => cats.add(t.category));
        return Array.from(cats).sort();
    }, [rangeData]);

    const availableAnalysisWallets = useMemo(() => {
        if (!rangeData?.transactions || !wallets) return [];
        const wids = new Set<string>();
        rangeData.transactions.forEach((t: any) => { if (t.walletId) wids.add(t.walletId); });
        return wallets.filter(w => wids.has(w.id));
    }, [rangeData, wallets]);

    // Chart data based on groupBy
    const analysisChartData = useMemo(() => {
        if (filteredRangeTransactions.length === 0) return [];

        if (analysisGroupBy === 'category') {
            const byCategory = new Map<string, number>();
            filteredRangeTransactions.forEach((t: any) => {
                byCategory.set(t.category, (byCategory.get(t.category) || 0) + t.actual);
            });
            return Array.from(byCategory.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        }

        if (analysisGroupBy === 'wallet') {
            const byWallet = new Map<string, number>();
            filteredRangeTransactions.forEach((t: any) => {
                const wName = wallets.find(w => w.id === t.walletId)?.name || 'Unknown';
                byWallet.set(wName, (byWallet.get(wName) || 0) + t.actual);
            });
            return Array.from(byWallet.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        }

        if (analysisGroupBy === 'month') {
            const byMonth = new Map<string, number>();
            // Preserve chronological order from rangeData.months
            if (rangeData?.months) {
                rangeData.months.forEach(m => {
                    byMonth.set(`${m.month.slice(0, 3)} ${m.year}`, 0);
                });
            }
            filteredRangeTransactions.forEach((t: any) => {
                const key = `${(t._month as string).slice(0, 3)} ${t._year}`;
                byMonth.set(key, (byMonth.get(key) || 0) + t.actual);
            });
            return Array.from(byMonth.entries()).map(([name, value]) => ({ name, value }));
        }

        return [];
    }, [filteredRangeTransactions, analysisGroupBy, wallets, rangeData]);

    // Summary stats
    const analysisSummary = useMemo(() => {
        const total = filteredRangeTransactions.reduce((sum: number, t: any) => sum + t.actual, 0);
        const count = filteredRangeTransactions.length;
        const categories = new Set(filteredRangeTransactions.map((t: any) => t.category)).size;
        return { total, count, categories };
    }, [filteredRangeTransactions]);

    // Color palette for the bar chart
    const analysisColors = ['#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6', '#e879f9', '#84cc16', '#fb7185'];

    // Get available expense categories from transactions (only those with actual expenses)
    const availableExpenseCategories = useMemo(() => {
        if (!budget?.transactions) return [];
        const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added'];
        const excludedCategories = ['Savings', 'Transfer'];

        const categories = new Set<string>();
        budget.transactions.forEach((t: any) => {
            // Only include expense categories (not income, savings, or transfers)
            if (!incomeCategories.includes(t.category) &&
                !excludedCategories.includes(t.category) &&
                t.type !== 'transfer' &&
                t.type !== 'income' &&
                t.actual > 0) {
                categories.add(t.category);
            }
        });
        return Array.from(categories).sort();
    }, [budget?.transactions]);

    // Toggle category selection
    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    // Toggle yearly category selection
    const toggleYearlyCategory = (category: string) => {
        setSelectedYearlyCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    // 1. Prepare Daily Trend Data - With category filtering for expenses
    const chartData = useMemo(() => {
        const transactions = budget?.transactions || [];
        const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added'];

        // Get days in current month
        const daysInMonth = new Date(currentYear, date.getMonth() + 1, 0).getDate();

        // Calculate total wallet balance as starting point for Net Worth
        const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

        // Calculate cumulative changes from today backwards to get starting balance
        // We need to reverse-calculate what the balance was at the START of the month
        const today = new Date();
        const isCurrentMonth = date.getMonth() === today.getMonth() && currentYear === today.getFullYear();

        // For net worth, we calculate cumulative changes starting from beginning of month
        // First pass: collect all daily net changes
        let dailyNetChanges: { day: number; netChange: number; income: number; expense: number; transfers: number }[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(currentYear, date.getMonth(), day);
            const dayStr = format(dateObj, 'yyyy-MM-dd');

            // Filter transactions for this day
            const dayTransactions = transactions.filter((t: any) => {
                const tDate = new Date(t.date);
                return tDate.getDate() === day &&
                    tDate.getMonth() === date.getMonth() &&
                    tDate.getFullYear() === currentYear;
            });

            // Calculate income (always unfiltered)
            const income = dayTransactions
                .filter((t: any) => t.type === 'income' || incomeCategories.includes(t.category))
                .reduce((sum: number, t: any) => sum + t.actual, 0);

            // Calculate expense - with category filtering if categories are selected
            const expenseTransactions = dayTransactions.filter((t: any) => {
                // Exclude income, savings, and transfers
                if (t.type === 'income' || incomeCategories.includes(t.category)) return false;
                if (t.category === 'Savings' || t.type === 'savings') return false;
                if (t.category === 'Transfer' || t.type === 'transfer') return false;

                // Apply category filter if any categories are selected
                if (selectedCategories.length > 0) {
                    return selectedCategories.includes(t.category);
                }
                return true;
            });
            const expense = expenseTransactions.reduce((sum: number, t: any) => sum + t.actual, 0);

            // Calculate transfers (transfers between wallets + goal contributions)
            const transfers = dayTransactions
                .filter((t: any) => t.type === 'transfer' || t.category === 'Transfer')
                .reduce((sum: number, t: any) => sum + t.actual, 0);

            dailyNetChanges.push({
                day,
                netChange: income - expense,
                income,
                expense,
                transfers
            });
        }

        // Calculate starting balance by working backwards from current wallet balance
        // Total wallet balance = startingBalanceAtMonthStart + allChangesThisMonth
        // So: startingBalanceAtMonthStart = Total wallet balance - allChangesThisMonth
        const totalMonthlyChange = dailyNetChanges.reduce((sum, d) => sum + d.netChange, 0);
        const startingBalance = isCurrentMonth ? totalWalletBalance - totalMonthlyChange : 0;

        // Build daily data with cumulative net worth
        let data = [];
        let cumulativeNetWorth = startingBalance;

        for (let i = 0; i < dailyNetChanges.length; i++) {
            const dayData = dailyNetChanges[i];
            const dateObj = new Date(currentYear, date.getMonth(), dayData.day);

            cumulativeNetWorth += dayData.netChange;

            data.push({
                day: dayData.day,
                date: format(dateObj, 'dd'),
                fullDate: format(dateObj, 'EEEE dd'),
                week: Math.ceil(dayData.day / 7),
                income: dayData.income,
                expense: dayData.expense,
                transfers: dayData.transfers,
                netWorth: cumulativeNetWorth,
            });
        }

        if (xAxisMode === 'weekly') {
            const weeklyMap = new Map();
            let weeklyNetWorth = startingBalance;

            data.forEach((d: any) => {
                const key = `Week ${d.week}`;
                if (!weeklyMap.has(key)) {
                    weeklyMap.set(key, {
                        date: key,
                        fullDate: key,
                        income: 0,
                        expense: 0,
                        transfers: 0,
                        netWorth: 0
                    });
                }
                const weekData = weeklyMap.get(key);
                weekData.income += d.income;
                weekData.expense += d.expense;
                weekData.transfers += d.transfers;
            });

            // Recalculate cumulative net worth for weekly view
            const weeks = Array.from(weeklyMap.values());
            weeks.forEach((w: any) => {
                weeklyNetWorth += (w.income - w.expense);
                w.netWorth = weeklyNetWorth;
            });
            data = weeks;
        }

        if (yAxisMode === 'cumulative') {
            let runningIncome = 0;
            let runningExpense = 0;
            let runningTransfers = 0;

            data = data.map((d: any) => {
                runningIncome += d.income;
                runningExpense += d.expense;
                runningTransfers += d.transfers;
                return {
                    ...d,
                    income: runningIncome,
                    expense: runningExpense,
                    transfers: runningTransfers,
                    // Net Worth is already cumulative, don't change it
                };
            });
        }

        return data;
    }, [budget?.transactions, currentYear, date, xAxisMode, yAxisMode, selectedCategories, wallets]);

    // 2. Prepare Pie Data (Expenses) - Use Optimized Server Data
    const pieData = useMemo(() => {
        if (monthlyStats?.pieData) return monthlyStats.pieData;
        return [];
    }, [monthlyStats]);

    // Colors for Pie Chart - Using Theme Variables
    const pieColors = [
        '#2DD4BF', // Teal (Rent)
        '#FACC15', // Yellow (Food)
        '#F472B6', // Pink (Snacks)
        '#A78BFA', // Purple (Loans)
        '#4ADE80', // Green (Utilities)
        '#38BDF8', // Sky Blue (Transportation)
        '#FB923C', // Orange
        '#818CF8', // Indigo
        '#F87171', // Red
        '#A3E635', // Lime
        '#E879F9', // Fuchsia
        '#60A5FA', // Blue
        '#C084FC', // Violet
        '#FB7185', // Rose
    ];

    // 3. Prepare Goals Data - Only show active goals (exclude fulfilled/completed)
    const goalsData = useMemo(() => {
        if (!goals) return [];
        // Filter to only active goals to avoid showing fulfilled goals in progress section
        const activeGoals = goals.filter(g => g.status === 'active' || !g.status);
        return activeGoals.map(g => {
            const current = g.currentAmount || 0;
            const target = g.targetAmount || 1; // Prevent div by zero
            const percent = Math.min(100, (current / target) * 100);

            return {
                name: g.name,
                saved: current,
                target: target,
                remaining: Math.max(0, target - current),
                percent: Math.round(percent),
                // Normalized values for the bar chart (always sums to 100)
                barSaved: percent,
                barRemaining: 100 - percent,
                color: g.color || 'hsl(var(--primary))'
            };
        });
    }, [goals]);



    // Label for Saved Bar (visible inside ONLY if percent is large enough)
    const renderSavedLabel = (props: any) => {
        const { x, y, width, height, index } = props;
        const data = goalsData[index];
        const p = data ? data.percent : 0;

        // If > 15%, we assume it fits inside and render cleanly.
        if (p >= 15) {
            return (
                <text x={x + width - 5} y={y + height / 2 + 5} textAnchor="end" fill="hsl(var(--primary-foreground))" fontSize={12} fontWeight="bold">
                    {p}%
                </text>
            );
        }
        return null;
    };

    // Label for Remaining Bar (handles small percentages to render on TOP of background)
    const renderRemainingLabel = (props: any) => {
        const { x, y, height, index } = props;
        const data = goalsData[index];
        const p = data ? data.percent : 0;

        // If < 15%, render it here (outside logic) so it sits on top of the grey bar
        if (p < 15) {
            return (
                <text x={x + 5} y={y + height / 2 + 5} textAnchor="start" fill="hsl(var(--primary))" fontSize={12} fontWeight="bold">
                    {p}%
                </text>
            );
        }
        return null;
    };

    // 4. Prepare Wallet Activity Data
    const walletData = useMemo(() => {
        if (!budget?.transactions || !wallets) return [];
        const stats = new Map();

        budget.transactions.forEach((t: any) => {
            if (!t.walletId) return;
            // Identify if expense or income for balance tracking
            const isExpense = !['Paycheck', 'Bonus', 'Debt Added', 'Savings'].includes(t.category);
            const isIncome = ['Paycheck', 'Bonus', 'Debt Added'].includes(t.category);

            if (!stats.has(t.walletId)) stats.set(t.walletId, { expense: 0, income: 0 });
            const s = stats.get(t.walletId);

            if (isExpense) {
                s.expense += t.actual;
            } else if (isIncome) {
                s.income += t.actual;
            }
        });

        const isCurrent = isSameMonth(date, new Date());

        return wallets
            .map((w: any) => {
                const s = stats.get(w.id) || { expense: 0, income: 0 };

                // Start Balance Approximation
                let startBalance = w.balance;
                if (isCurrent) {
                    startBalance = w.balance + s.expense - s.income;
                }

                const totalAvailable = startBalance + s.income;
                const usage = s.expense;
                const remaining = totalAvailable - usage;
                const percentage = totalAvailable > 0 ? (usage / totalAvailable) * 100 : 0;

                return {
                    id: w.id,
                    name: w.name,
                    expense: s.expense,
                    income: s.income,
                    startBalance: startBalance,
                    totalAvailable: totalAvailable,
                    remaining: remaining,
                    percentage: percentage,
                    color: w.color || 'hsl(var(--primary))'
                };
            })
            .sort((a: any, b: any) => b.expense - a.expense);
    }, [budget, wallets, date]);

    const totalMonthlyExpense = useMemo(() => {
        return pieData.reduce((acc, curr) => acc + (curr.value || 0), 0);
    }, [pieData]);

    // Get available yearly categories from yearlyStats
    const availableYearlyCategories = useMemo(() => {
        if (!yearlyStats) return [];
        const categories = new Set<string>();
        yearlyStats.forEach((monthData: any) => {
            if (monthData.categories) {
                Object.keys(monthData.categories).forEach(cat => categories.add(cat));
            }
        });
        return Array.from(categories).sort();
    }, [yearlyStats]);

    // Calculate filtered yearly data for chart
    const filteredYearlyData = useMemo(() => {
        if (!yearlyStats) return [];

        return yearlyStats.map((monthData: any) => {
            let expense = 0;

            if (selectedYearlyCategories.length > 0) {
                // Sum only selected categories
                selectedYearlyCategories.forEach(cat => {
                    expense += monthData.categories?.[cat] || 0;
                });
            } else {
                // Use total expense
                expense = monthData.expense || 0;
            }

            return {
                name: monthData.name,
                expense,
                income: monthData.income || 0,
                netWorth: monthData.netWorth || 0
            };
        });
    }, [yearlyStats, selectedYearlyCategories]);

    // Apply X-axis grouping for yearly data
    const transformedYearlyData = useMemo(() => {
        let data = [...filteredYearlyData];

        // X-Axis Grouping: Quarterly
        if (yearlyXAxisMode === 'quarterly') {
            const quarters = [
                { name: 'Q1', months: ['Jan', 'Feb', 'Mar'] },
                { name: 'Q2', months: ['Apr', 'May', 'Jun'] },
                { name: 'Q3', months: ['Jul', 'Aug', 'Sep'] },
                { name: 'Q4', months: ['Oct', 'Nov', 'Dec'] }
            ];

            data = quarters.map(q => ({
                name: q.name,
                expense: filteredYearlyData
                    .filter((m: any) => q.months.includes(m.name))
                    .reduce((sum: number, m: any) => sum + m.expense, 0),
                income: filteredYearlyData
                    .filter((m: any) => q.months.includes(m.name))
                    .reduce((sum: number, m: any) => sum + (m.income || 0), 0),
                netWorth: filteredYearlyData
                    .filter((m: any) => q.months.includes(m.name))
                    .reduce((sum: number, m: any) => sum + (m.netWorth || 0), 0)
            }));
        }

        return data;
    }, [filteredYearlyData, yearlyXAxisMode]);

    const totalYearlyExpense = useMemo(() => {
        return filteredYearlyData.reduce((acc: number, curr: any) => acc + (curr.expense || 0), 0);
    }, [filteredYearlyData]);

    // Calculate yearly averages based on months with actual expenses
    const yearlyAverages = useMemo(() => {
        const monthsWithExpense = filteredYearlyData.filter((m: any) => m.expense > 0).length;
        const avgMonthlyExpense = monthsWithExpense > 0 ? totalYearlyExpense / monthsWithExpense : 0;
        return {
            avgMonthlyExpense,
            monthsWithExpense
        };
    }, [filteredYearlyData, totalYearlyExpense]);

    // Calculate daily averages based on actual spending days - uses filtered chartData for expenses
    const dailyAverages = useMemo(() => {
        if (chartData.length === 0) return { avgExpense: 0, avgIncome: 0, avgTransfers: 0, daysWithExpense: 0, daysWithIncome: 0, daysWithTransfers: 0, totalExpense: 0, totalIncome: 0, totalTransfers: 0 };

        // Use chartData which respects category filtering for expenses
        const daysWithExpense = chartData.filter((d: any) => d.expense > 0).length;
        const daysWithIncome = chartData.filter((d: any) => d.income > 0).length;
        const daysWithTransfers = chartData.filter((d: any) => d.transfers > 0).length;

        const totalExpense = chartData.reduce((sum: number, d: any) => sum + d.expense, 0);
        const totalIncome = chartData.reduce((sum: number, d: any) => sum + d.income, 0);
        const totalTransfers = chartData.reduce((sum: number, d: any) => sum + d.transfers, 0);

        return {
            avgExpense: daysWithExpense > 0 ? totalExpense / daysWithExpense : 0,
            avgIncome: daysWithIncome > 0 ? totalIncome / daysWithIncome : 0,
            avgTransfers: daysWithTransfers > 0 ? totalTransfers / daysWithTransfers : 0,
            totalExpense,
            totalIncome,
            totalTransfers,
            daysWithExpense,
            daysWithIncome,
            daysWithTransfers,
        };
    }, [chartData]);

    // === NEW ANALYTICS COMPUTATIONS ===

    // Budget vs Actual data - compare category limits to actual spending
    const budgetVsActualData = useMemo(() => {
        if (!budget?.transactions || !budget?.categoryLimits) return [];
        const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added'];
        const excludedCategories = ['Savings', 'Transfer'];

        // Calculate actual spending per category
        const actualByCategory = new Map<string, number>();
        budget.transactions.forEach((t: any) => {
            if (incomeCategories.includes(t.category) || t.type === 'income') return;
            if (excludedCategories.includes(t.category) || t.type === 'transfer' || t.type === 'savings') return;
            actualByCategory.set(t.category, (actualByCategory.get(t.category) || 0) + t.actual);
        });

        const data: { category: string; budget: number; actual: number; overBudget: boolean }[] = [];
        Object.entries(budget.categoryLimits).forEach(([cat, limit]) => {
            if (typeof limit !== 'number' || limit <= 0) return;
            const actual = actualByCategory.get(cat) || 0;
            data.push({ category: cat, budget: limit, actual, overBudget: actual > limit });
        });

        return data.sort((a, b) => b.actual - a.actual);
    }, [budget]);

    // Month-over-Month comparison data
    const monthOverMonthData = useMemo(() => {
        if (!budget?.transactions) return [];
        const incomeCategories = ['income', 'Paycheck', 'Bonus', 'Debt Added'];
        const excludedCategories = ['Savings', 'Transfer'];

        const currentByCategory = new Map<string, number>();
        budget.transactions.forEach((t: any) => {
            if (incomeCategories.includes(t.category) || t.type === 'income') return;
            if (excludedCategories.includes(t.category) || t.type === 'transfer' || t.type === 'savings') return;
            currentByCategory.set(t.category, (currentByCategory.get(t.category) || 0) + t.actual);
        });

        const prevByCategory = new Map<string, number>();
        if (prevBudget?.transactions) {
            prevBudget.transactions.forEach((t: any) => {
                if (incomeCategories.includes(t.category) || t.type === 'income') return;
                if (excludedCategories.includes(t.category) || t.type === 'transfer' || t.type === 'savings') return;
                prevByCategory.set(t.category, (prevByCategory.get(t.category) || 0) + t.actual);
            });
        }

        const allCategories = new Set([...currentByCategory.keys(), ...prevByCategory.keys()]);
        return Array.from(allCategories)
            .map(cat => ({
                category: cat,
                current: currentByCategory.get(cat) || 0,
                previous: prevByCategory.get(cat) || 0,
            }))
            .filter(d => d.current > 0 || d.previous > 0)
            .sort((a, b) => b.current - a.current);
    }, [budget, prevBudget]);

    // Filter Month-over-Month data
    const filteredMonthOverMonthData = useMemo(() => {
        if (!monthOverMonthData) return [];
        if (selectedMonthOverMonthCategories.length > 0) {
            return monthOverMonthData.filter(d => selectedMonthOverMonthCategories.includes(d.category));
        }
        return monthOverMonthData.slice(0, 10);
    }, [monthOverMonthData, selectedMonthOverMonthCategories]);

    // Savings rate data for radial gauge
    const savingsRateData = useMemo(() => {
        const income = stats?.income || 0;
        const savings = stats?.savings || 0;
        const rate = income > 0 ? Math.round((savings / income) * 100) : 0;
        const prevIncome = prevStats?.income || 0;
        const prevSavingsVal = prevStats?.savings || 0;
        const prevRate = prevIncome > 0 ? Math.round((prevSavingsVal / prevIncome) * 100) : 0;
        return { rate: Math.min(rate, 100), prevRate, savings, income };
    }, [stats, prevStats]);

    // Top spending categories (ranked)
    const topCategories = useMemo(() => {
        if (!pieData || pieData.length === 0) return [];
        const total = pieData.reduce((sum: number, d: any) => sum + d.value, 0);
        return pieData
            .map((d: any, i: number) => ({
                name: d.name,
                value: d.value,
                percentage: total > 0 ? (d.value / total) * 100 : 0,
                color: pieColors[i % pieColors.length],
            }))
            .sort((a: any, b: any) => b.value - a.value)
            .slice(0, 8);
    }, [pieData]);



    if ((isLoadingBudget || isLoadingMonthlyStats) && !monthlyStats) {
        return <LoadingScreen size="lg" />;
    }

    return (
        <div className="min-h-screen bg-background text-white p-6 md:p-8 relative overflow-hidden">
            {/* Animated background decorations */}
            <div className="hidden md:block absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="hidden md:block absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
            <div className="hidden md:block absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-rose-500/10 via-red-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="hidden md:block absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />

            <div className="relative z-10 max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-serif text-white">Statistics</h1>
                        <p className="text-gray-500 mt-1">Analyze your financial patterns</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Month Selector */}
                        <div className="flex items-center bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-1.5">
                            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 hover:bg-primary hover:text-black transition-all rounded-xl">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold text-white min-w-[150px] text-center flex items-center justify-center gap-2 px-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                {currentMonthName} {currentYear}
                            </span>
                            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 hover:bg-primary hover:text-black transition-all rounded-xl">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        {/* Toggle Buttons */}
                        <div className="flex gap-2">
                            <Button
                                variant={showIncome ? "default" : "outline"}
                                onClick={() => setShowIncome(!showIncome)}
                                className={`h-10 rounded-xl ${showIncome ? 'bg-green-500 hover:bg-green-600 text-black' : 'border-zinc-700 text-gray-400 hover:text-white hover:border-green-500/50'}`}
                            >
                                <TrendingUp className="h-4 w-4 mr-1" /> Income
                            </Button>
                            <Button
                                variant={showExpense ? "default" : "outline"}
                                onClick={() => setShowExpense(!showExpense)}
                                className={`h-10 rounded-xl ${showExpense ? 'bg-red-500 hover:bg-red-600 text-white' : 'border-zinc-700 text-gray-400 hover:text-white hover:border-red-500/50'}`}
                            >
                                <TrendingDown className="h-4 w-4 mr-1" /> Expenses
                            </Button>
                            <Button
                                variant={showTransfers ? "default" : "outline"}
                                onClick={() => setShowTransfers(!showTransfers)}
                                className={`h-10 rounded-xl ${showTransfers ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border-zinc-700 text-gray-400 hover:text-white hover:border-blue-500/50'}`}
                            >
                                <ArrowRightLeft className="h-4 w-4 mr-1" /> Transfers
                            </Button>
                            <Button
                                variant={showNetWorth ? "default" : "outline"}
                                onClick={() => setShowNetWorth(!showNetWorth)}
                                className={`h-10 rounded-xl ${showNetWorth ? 'bg-violet-500 hover:bg-violet-600 text-white' : 'border-zinc-700 text-gray-400 hover:text-white hover:border-violet-500/50'}`}
                            >
                                <TrendingUp className="h-4 w-4 mr-1" /> Net Worth
                            </Button>
                        </div>
                    </div>
                </div>



                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Financial Flow (Area Chart) */}
                    <div className="col-span-1 lg:col-span-2 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-zinc-900/80 to-zinc-900/50 border border-emerald-500/30 overflow-hidden shadow-lg shadow-emerald-500/5">
                        <div className="p-4 md:p-6 border-b border-emerald-500/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/10 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/20 shadow-inner">
                                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-semibold font-serif text-white">{xAxisMode === 'weekly' ? 'Weekly' : 'Daily'} Financial Flow</h2>
                            </div>

                            {/* Daily Averages - Inline Stats */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {showExpense && (
                                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                        <TrendingDown className="h-4 w-4 text-red-400" />
                                        <div className="text-sm">
                                            <span className="text-gray-400">Avg/day: </span>
                                            <span className="font-bold text-red-400 text-base">{currency}{dailyAverages.avgExpense.toFixed(0)}</span>
                                            <span className="text-gray-500 ml-1.5">({dailyAverages.daysWithExpense}d)</span>
                                        </div>
                                    </div>
                                )}
                                {showIncome && (
                                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                                        <TrendingUp className="h-4 w-4 text-green-400" />
                                        <div className="text-sm">
                                            <span className="text-gray-400">Avg/day: </span>
                                            <span className="font-bold text-green-400 text-base">{currency}{dailyAverages.avgIncome.toFixed(0)}</span>
                                            <span className="text-gray-500 ml-1.5">({dailyAverages.daysWithIncome}d)</span>
                                        </div>
                                    </div>
                                )}
                                {showTransfers && (
                                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <ArrowRightLeft className="h-4 w-4 text-blue-400" />
                                        <div className="text-sm">
                                            <span className="text-gray-400">Avg/day: </span>
                                            <span className="font-bold text-blue-400 text-base">{currency}{dailyAverages.avgTransfers.toFixed(0)}</span>
                                            <span className="text-gray-500 ml-1.5">({dailyAverages.daysWithTransfers}d)</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 md:gap-3">
                                <Select value={xAxisMode} onValueChange={(v: any) => setXAxisMode(v)}>
                                    <SelectTrigger className="w-[100px] md:w-[120px] bg-zinc-800 border-zinc-700 rounded-xl text-xs md:text-sm">
                                        <SelectValue placeholder="X-Axis" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={yAxisMode} onValueChange={(v: any) => setYAxisMode(v)}>
                                    <SelectTrigger className="w-[100px] md:w-[120px] bg-zinc-800 border-zinc-700 rounded-xl text-xs md:text-sm">
                                        <SelectValue placeholder="Y-Axis" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="cumulative">Cumulative</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="w-[80px] md:w-[100px]">
                                    <Input
                                        type="number"
                                        placeholder="Y-Max"
                                        value={yAxisMax}
                                        onChange={(e) => setYAxisMax(e.target.value)}
                                        className="bg-zinc-800 border-zinc-700 rounded-xl text-xs md:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Category Filter - Only show when expenses are visible and categories exist */}
                        {showExpense && availableExpenseCategories.length > 0 && (
                            <div className="px-4 md:px-6 py-3 border-b border-emerald-500/10 bg-zinc-900/50">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Tags className="h-4 w-4" />
                                        <span>Filter by category:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {availableExpenseCategories.map(category => {
                                            const isSelected = selectedCategories.includes(category);
                                            return (
                                                <button
                                                    key={category}
                                                    onClick={() => toggleCategory(category)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected
                                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                                                        }`}
                                                >
                                                    {category}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedCategories.length > 0 && (
                                        <button
                                            onClick={() => setSelectedCategories([])}
                                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-700 text-gray-300 hover:bg-zinc-600 transition-all"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="p-6">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="date"
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${currency}${value}`}
                                            domain={[0, yAxisMax ? parseInt(yAxisMax) : 'auto']}
                                            allowDataOverflow={true}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                                            labelFormatter={(label, payload) => {
                                                if (payload && payload[0]?.payload?.fullDate) {
                                                    return payload[0].payload.fullDate;
                                                }
                                                return label;
                                            }}
                                            formatter={(value: number, name: string) => [`${currency}${value.toFixed(2)}`, name]}
                                        />
                                        <Legend />
                                        {showIncome && (
                                            <Area
                                                type="monotone"
                                                dataKey="income"
                                                name="Income"
                                                stroke="hsl(var(--primary))"
                                                fillOpacity={1}
                                                fill="url(#colorIncome)"
                                                strokeWidth={2}
                                            />
                                        )}
                                        {showExpense && (
                                            <Area
                                                type="monotone"
                                                dataKey="expense"
                                                name="Expenses"
                                                stroke="hsl(var(--destructive))"
                                                fillOpacity={1}
                                                fill="url(#colorExpense)"
                                                strokeWidth={2}
                                            />
                                        )}
                                        {showTransfers && (
                                            <Area
                                                type="monotone"
                                                dataKey="transfers"
                                                name="Transfers"
                                                stroke="hsl(var(--chart-2))"
                                                fillOpacity={1}
                                                fill="url(#colorSavings)"
                                                strokeWidth={2}
                                            />
                                        )}
                                        {showNetWorth && (
                                            <Area
                                                type="monotone"
                                                dataKey="netWorth"
                                                name="Net Worth"
                                                stroke="#8b5cf6"
                                                fillOpacity={1}
                                                fill="url(#colorNetWorth)"
                                                strokeWidth={2}
                                            />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Expense Breakdown (Pie Chart) - Left Side */}
                    <div className="col-span-1 rounded-2xl bg-gradient-to-br from-violet-500/10 via-zinc-900/80 to-zinc-900/50 border border-violet-500/30 overflow-hidden shadow-lg shadow-violet-500/5">
                        <div className="p-6 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 shadow-inner">
                                    <PieChartIcon className="h-5 w-5 text-violet-400" />
                                </div>
                                <h2 className="text-xl font-semibold font-serif text-white">Expense Breakdown</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="h-[350px] lg:h-[450px] w-full">
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="45%"
                                                outerRadius="60%"
                                                paddingAngle={2}
                                                dataKey="value"
                                                labelLine={false}
                                                label={(props) => {
                                                    const RADIAN = Math.PI / 180;
                                                    const { cx, cy, midAngle, outerRadius, percent, index, name } = props;

                                                    // Custom logic for "spider" legs
                                                    const sin = Math.sin(-RADIAN * midAngle);
                                                    const cos = Math.cos(-RADIAN * midAngle);
                                                    const sx = cx + (outerRadius + 10) * cos;
                                                    const sy = cy + (outerRadius + 10) * sin;
                                                    const mx = cx + (outerRadius + 30) * cos;
                                                    const my = cy + (outerRadius + 30) * sin;
                                                    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
                                                    const ey = my;
                                                    const textAnchor = cos >= 0 ? 'start' : 'end';

                                                    return (
                                                        <g>
                                                            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={pieColors[index % pieColors.length]} fill="none" />
                                                            <circle cx={ex} cy={ey} r={2} fill={pieColors[index % pieColors.length]} stroke="none" />
                                                            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={4} textAnchor={textAnchor} fill={pieColors[index % pieColors.length]} fontSize={14} fontWeight="500">
                                                                {`${name} ${(percent * 100).toFixed(0)}%`}
                                                            </text>
                                                        </g>
                                                    );
                                                }}
                                                stroke="none"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                                ))}
                                                <Label
                                                    content={({ viewBox }) => {
                                                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                            return (
                                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                                    <tspan x={viewBox.cx} y={viewBox.cy} dy="-10" className="fill-muted-foreground text-xs font-medium uppercase tracking-wider">
                                                                        Total Spent
                                                                    </tspan>
                                                                    <tspan x={viewBox.cx} y={viewBox.cy} dy="20" className="fill-primary text-xl font-bold" style={{ filter: 'drop-shadow(0 0 1px hsl(var(--primary)))' }}>
                                                                        {currency}{totalMonthlyExpense.toFixed(2)}
                                                                    </tspan>
                                                                </text>
                                                            )
                                                        }
                                                        return null;
                                                    }}
                                                    position="center"
                                                />
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                                formatter={(value: number) => [`${currency}${value.toFixed(2)}`, 'Amount']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        No expense data available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Goals Progress - Right Side (Revamped) */}
                    <div className="col-span-1 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-900/50 border border-amber-500/30 overflow-hidden shadow-lg shadow-amber-500/5">
                        <div className="p-6 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/20 shadow-inner">
                                        <Target className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <h2 className="text-xl font-semibold font-serif text-white">Goals Progress</h2>
                                </div>
                                {goalsData.length > 0 && (
                                    <div className="text-right">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Active Goals</span>
                                        <div className="text-lg font-bold text-amber-400">{goalsData.length}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="h-[350px] lg:h-[450px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                                {goalsData.length > 0 ? (
                                    <div className="space-y-3">
                                        {goalsData.map((goal, index) => {
                                            const isComplete = goal.percent >= 100;
                                            const isAlmostComplete = goal.percent >= 80 && goal.percent < 100;
                                            const progressColor = isComplete
                                                ? 'from-green-500 to-emerald-400'
                                                : isAlmostComplete
                                                    ? 'from-yellow-500 to-amber-400'
                                                    : 'from-primary to-lime-400';
                                            const ringColor = isComplete
                                                ? '#22c55e'
                                                : isAlmostComplete
                                                    ? '#eab308'
                                                    : 'hsl(var(--primary))';

                                            // Calculate SVG circle properties (smaller ring)
                                            const radius = 18;
                                            const circumference = 2 * Math.PI * radius;
                                            const strokeDashoffset = circumference - (goal.percent / 100) * circumference;

                                            return (
                                                <div
                                                    key={index}
                                                    className={`group relative p-3 rounded-lg border transition-all duration-300 cursor-pointer ${isComplete
                                                        ? 'bg-gradient-to-r from-green-500/15 to-green-500/5 border-green-500/40 hover:border-green-500/60'
                                                        : isAlmostComplete
                                                            ? 'bg-gradient-to-r from-yellow-500/15 to-yellow-500/5 border-yellow-500/40 hover:border-yellow-500/60'
                                                            : 'bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 border-zinc-700/50 hover:border-amber-500/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* Circular Progress Ring (Compact) */}
                                                        <div className="relative flex-shrink-0">
                                                            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                                                                {/* Background circle */}
                                                                <circle
                                                                    cx="24"
                                                                    cy="24"
                                                                    r={radius}
                                                                    fill="none"
                                                                    stroke="hsl(var(--secondary))"
                                                                    strokeWidth="4"
                                                                />
                                                                {/* Progress circle */}
                                                                <circle
                                                                    cx="24"
                                                                    cy="24"
                                                                    r={radius}
                                                                    fill="none"
                                                                    stroke={ringColor}
                                                                    strokeWidth="4"
                                                                    strokeLinecap="round"
                                                                    strokeDasharray={circumference}
                                                                    strokeDashoffset={strokeDashoffset}
                                                                    className="transition-all duration-700 ease-out"
                                                                    style={{
                                                                        filter: `drop-shadow(0 0 4px ${ringColor})`
                                                                    }}
                                                                />
                                                            </svg>
                                                            {/* Percentage in center */}
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className={`text-xs font-bold ${isComplete ? 'text-green-400' : isAlmostComplete ? 'text-yellow-400' : 'text-primary'}`}>
                                                                    {goal.percent}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Goal Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h3 className="text-sm font-semibold text-white truncate">{goal.name}</h3>
                                                                {isComplete && (
                                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                                                                        COMPLETE
                                                                    </span>
                                                                )}
                                                                {isAlmostComplete && (
                                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                                                                        ALMOST
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Progress Bar */}
                                                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-1">
                                                                <div
                                                                    className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-700 ease-out rounded-full`}
                                                                    style={{ width: `${Math.min(100, goal.percent)}%` }}
                                                                />
                                                            </div>

                                                            {/* Amount Details */}
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className={`font-medium ${isComplete ? 'text-green-400' : 'text-primary'}`}>
                                                                    {currency}{goal.saved.toLocaleString()}
                                                                </span>
                                                                <span className="text-gray-500">
                                                                    / {currency}{goal.target.toLocaleString()}
                                                                    {!isComplete && goal.remaining > 0 && (
                                                                        <span className="text-amber-400 ml-1">({currency}{goal.remaining.toLocaleString()} left)</span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                                        <Target className="h-12 w-12 text-amber-500/30" />
                                        <p>No goals set</p>
                                        <p className="text-xs text-gray-600">Create a goal to track your savings progress</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* === Deep Dive Analysis Section === */}
                    <div className="col-span-1 lg:col-span-2 rounded-2xl bg-gradient-to-br from-violet-500/10 via-zinc-900/80 to-zinc-900/50 border border-violet-500/30 overflow-hidden relative shadow-lg shadow-violet-500/5">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-transparent">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 shadow-inner">
                                        <Search className="h-5 w-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold font-serif text-white">Deep Dive Analysis</h2>
                                        <p className="text-sm text-gray-500">Analyze data across any date range</p>
                                    </div>
                                </div>

                                {/* Summary Chips */}
                                {analysisSummary.count > 0 && (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="px-4 py-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-sm">
                                            <span className="text-gray-400">Total: </span>
                                            <span className="font-bold text-violet-400 text-lg">{currency}{analysisSummary.total.toFixed(2)}</span>
                                        </div>
                                        <div className="px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-sm">
                                            <span className="text-gray-400">{analysisSummary.count} transactions</span>
                                            <span className="text-gray-600 mx-1">·</span>
                                            <span className="text-gray-400">{analysisSummary.categories} categories</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Controls Row */}
                        <div className="px-6 py-4 border-b border-violet-500/10 bg-zinc-900/50">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                                {/* Date Range */}
                                <div className="flex items-center gap-2 flex-wrap text-sm">
                                    <Calendar className="h-4 w-4 text-violet-400 mr-1" />
                                    <span className="text-gray-400">From</span>
                                    <Select value={analysisStartMonth} onValueChange={setAnalysisStartMonth}>
                                        <SelectTrigger className="w-[110px] bg-zinc-800 border-zinc-700 rounded-xl text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            {monthNames.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={String(analysisStartYear)} onValueChange={v => setAnalysisStartYear(parseInt(v))}>
                                        <SelectTrigger className="w-[80px] bg-zinc-800 border-zinc-700 rounded-xl text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>

                                    <span className="text-gray-400 mx-2">To</span>

                                    <Select value={analysisEndMonth} onValueChange={setAnalysisEndMonth}>
                                        <SelectTrigger className="w-[110px] bg-zinc-800 border-zinc-700 rounded-xl text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            {monthNames.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={String(analysisEndYear)} onValueChange={v => setAnalysisEndYear(parseInt(v))}>
                                        <SelectTrigger className="w-[80px] bg-zinc-800 border-zinc-700 rounded-xl text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Type / GroupBy / View */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Select value={analysisType} onValueChange={(v: any) => setAnalysisType(v)}>
                                        <SelectTrigger className="w-[100px] bg-zinc-800 border-zinc-700 rounded-xl text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            <SelectItem value="expense">Expense</SelectItem>
                                            <SelectItem value="income">Income</SelectItem>
                                            <SelectItem value="transfer">Transfer</SelectItem>
                                            <SelectItem value="all">All</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={analysisGroupBy} onValueChange={(v: any) => setAnalysisGroupBy(v)}>
                                        <SelectTrigger className="w-[110px] bg-zinc-800 border-zinc-700 rounded-xl text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            <SelectItem value="category">By Category</SelectItem>
                                            <SelectItem value="wallet">By Wallet</SelectItem>
                                            <SelectItem value="month">By Month</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex rounded-xl overflow-hidden border border-zinc-700">
                                        <button
                                            onClick={() => setAnalysisView('chart')}
                                            className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${analysisView === 'chart' ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'}`}
                                        >
                                            <BarChart2 className="h-3.5 w-3.5" /> Chart
                                        </button>
                                        <button
                                            onClick={() => setAnalysisView('table')}
                                            className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${analysisView === 'table' ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'}`}
                                        >
                                            <Table className="h-3.5 w-3.5" /> Table
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category/Wallet Filters */}
                        {(availableAnalysisCategories.length > 0 || availableAnalysisWallets.length > 0) && (
                            <div className="px-6 py-3 border-b border-violet-500/10 bg-zinc-900/30">
                                <div className="flex flex-col gap-3">
                                    {/* Category filters */}
                                    {availableAnalysisCategories.length > 0 && (
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Tags className="h-4 w-4" />
                                                <span>Categories:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {availableAnalysisCategories.map(cat => {
                                                    const isActive = analysisCategories.includes(cat);
                                                    return (
                                                        <button
                                                            key={cat}
                                                            onClick={() => setAnalysisCategories(prev => isActive ? prev.filter(c => c !== cat) : [...prev, cat])}
                                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${isActive
                                                                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                                                                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                                                                }`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {analysisCategories.length > 0 && (
                                                <button onClick={() => setAnalysisCategories([])} className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-700 text-gray-300 hover:bg-zinc-600 transition-all flex items-center gap-1">
                                                    <X className="h-3 w-3" /> Clear
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {/* Wallet filters */}
                                    {availableAnalysisWallets.length > 0 && (
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Wallet className="h-4 w-4" />
                                                <span>Wallets:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {availableAnalysisWallets.map(w => {
                                                    const isActive = analysisWallets.includes(w.id);
                                                    return (
                                                        <button
                                                            key={w.id}
                                                            onClick={() => setAnalysisWallets(prev => isActive ? prev.filter(id => id !== w.id) : [...prev, w.id])}
                                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${isActive
                                                                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                                                                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                                                                }`}
                                                        >
                                                            {w.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {analysisWallets.length > 0 && (
                                                <button onClick={() => setAnalysisWallets([])} className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-700 text-gray-300 hover:bg-zinc-600 transition-all flex items-center gap-1">
                                                    <X className="h-3 w-3" /> Clear
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Visualization Area */}
                        <div className="p-6">
                            {isLoadingRange ? (
                                <div className="h-[350px] flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400"></div>
                                </div>
                            ) : analysisChartData.length === 0 ? (
                                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                    No data found for the selected range and filters
                                </div>
                            ) : analysisView === 'chart' ? (
                                <div style={{ height: (analysisGroupBy !== 'month') ? `${Math.max(180, analysisChartData.length * 40)}px` : '350px' }} className="w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        {analysisGroupBy === 'month' ? (
                                            <AreaChart data={analysisChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="deepDiveGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${currency}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                                <Tooltip
                                                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value: number) => [`${currency}${value.toFixed(2)}`, 'Amount']}
                                                />
                                                <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#deepDiveGrad)" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} />
                                            </AreaChart>
                                        ) : (
                                            <BarChart data={analysisChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} vertical={true} opacity={0.4} />
                                                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${currency}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={120} interval={0} />
                                                <Tooltip
                                                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value: number) => [`${currency}${value.toFixed(2)}`, 'Amount']}
                                                />
                                                <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]} barSize={24}>
                                                    {analysisChartData.map((_, idx) => (
                                                        <Cell key={idx} fill={analysisColors[idx % analysisColors.length]} fillOpacity={0.8} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                /* Table View */
                                <div className="overflow-x-auto rounded-xl border border-zinc-700/50">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-zinc-700/50 bg-zinc-800/50">
                                                <th className="text-left px-4 py-3 text-gray-400 font-medium">#</th>
                                                <th className="text-left px-4 py-3 text-gray-400 font-medium">{analysisGroupBy === 'wallet' ? 'Wallet' : analysisGroupBy === 'month' ? 'Month' : 'Category'}</th>
                                                <th className="text-right px-4 py-3 text-gray-400 font-medium">Amount</th>
                                                <th className="text-right px-4 py-3 text-gray-400 font-medium">Share</th>
                                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Bar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analysisChartData.map((item, idx) => {
                                                const maxVal = Math.max(...analysisChartData.map(d => d.value));
                                                const pct = analysisSummary.total > 0 ? (item.value / analysisSummary.total * 100) : 0;
                                                const barPct = maxVal > 0 ? (item.value / maxVal * 100) : 0;
                                                return (
                                                    <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                                                        <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                                                        <td className="px-4 py-3 text-right text-violet-300 font-mono">{currency}{item.value.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right text-gray-400">{pct.toFixed(1)}%</td>
                                                        <td className="px-4 py-3 w-[200px]">
                                                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all"
                                                                    style={{ width: `${barPct}%`, backgroundColor: analysisColors[idx % analysisColors.length] }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Wallet Spending (Redesigned) - Bottom Full Width */}
                    <div className="col-span-1 lg:col-span-2 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-zinc-900/80 to-zinc-900/50 border border-cyan-500/30 overflow-hidden shadow-lg shadow-cyan-500/5">
                        <div className="p-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 shadow-inner">
                                    <Wallet className="h-5 w-5 text-cyan-400" />
                                </div>
                                <h2 className="text-xl font-semibold font-serif text-white">Wallet Spending</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col gap-6">
                                {walletData.length > 0 ? (
                                    walletData.map((wallet: any, index: number) => (
                                        <div key={wallet.id} className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold">{wallet.name}</div>
                                                    <div className="text-primary text-xs">
                                                        (Remaining: {currency}{wallet.remaining?.toFixed(2) || '0.00'})
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`${wallet.percentage > 90 ? 'text-destructive' : 'text-foreground'} font-medium`}>{currency}{wallet.expense.toFixed(2)}</span>
                                                    <span className="text-muted-foreground">/</span>
                                                    <span className="font-medium text-primary">{currency}{wallet.totalAvailable?.toFixed(2) || '0.00'}</span>
                                                </div>
                                            </div>
                                            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-500"
                                                    style={{ width: `${Math.min(100, wallet.percentage)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 flex items-center justify-center text-muted-foreground">
                                        No wallet activity this month
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* === NEW ANALYTICS SECTIONS === */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">


                    {/* Month-over-Month Comparison - Full Width */}
                    {monthOverMonthData.length > 0 && (
                        <div className="col-span-1 lg:col-span-2 rounded-2xl bg-gradient-to-br from-orange-500/10 via-zinc-900/80 to-zinc-900/50 border border-orange-500/30 overflow-hidden shadow-lg shadow-orange-500/5">
                            <div className="p-6 border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/20 shadow-inner">
                                        <ArrowRightLeft className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold font-serif text-white">Month-over-Month</h2>
                                        <p className="text-sm text-gray-500">Compare with previous month by category</p>
                                    </div>
                                </div>
                            </div>

                            {/* Category Filter */}
                            {monthOverMonthData.length > 0 && (
                                <div className="px-6 py-3 border-b border-orange-500/10 bg-zinc-900/50">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Tags className="h-4 w-4" />
                                            <span>Filter:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {monthOverMonthData.map(d => {
                                                const isDisplayed = filteredMonthOverMonthData.some(fd => fd.category === d.category);
                                                const isSelected = selectedMonthOverMonthCategories.includes(d.category);
                                                return (
                                                    <button
                                                        key={d.category}
                                                        onClick={() => {
                                                            if (selectedMonthOverMonthCategories.length === 0) {
                                                                // Initialize selection based on default Top 10 view
                                                                const defaultTop10 = monthOverMonthData.slice(0, 10).map(m => m.category);
                                                                if (defaultTop10.includes(d.category)) {
                                                                    // User wants to HIDE a default category -> Select all others
                                                                    setSelectedMonthOverMonthCategories(defaultTop10.filter(c => c !== d.category));
                                                                } else {
                                                                    // User wants to SHOW a hidden category -> select Top 10 + this new one
                                                                    setSelectedMonthOverMonthCategories([...defaultTop10, d.category]);
                                                                }
                                                            } else {
                                                                // Standard toggle behavior
                                                                if (isSelected) {
                                                                    setSelectedMonthOverMonthCategories(selectedMonthOverMonthCategories.filter(c => c !== d.category));
                                                                } else {
                                                                    setSelectedMonthOverMonthCategories([...selectedMonthOverMonthCategories, d.category]);
                                                                }
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isDisplayed
                                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                                            : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                                                            }`}
                                                    >
                                                        {d.category}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {selectedMonthOverMonthCategories.length > 0 && (
                                            <button
                                                onClick={() => setSelectedMonthOverMonthCategories([])}
                                                className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-700 text-gray-300 hover:bg-zinc-600 transition-all"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="p-6">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <BarChart data={filteredMonthOverMonthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="currentMonthGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#fb923c" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0.3} />
                                                </linearGradient>
                                                <linearGradient id="prevMonthGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.6} />
                                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.2} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                                            <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${currency}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                            <Tooltip
                                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem' }}
                                                formatter={(value: number, name: string) => [`${currency}${value.toFixed(2)}`, name]}
                                            />
                                            <Legend />
                                            <Bar dataKey="previous" name="Previous Month" fill="url(#prevMonthGrad)" radius={[6, 6, 0, 0]} maxBarSize={35} />
                                            <Bar dataKey="current" name="Current Month" fill="url(#currentMonthGrad)" radius={[6, 6, 0, 0]} maxBarSize={35} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Yearly Expense Overview */}
                <div className="mt-8 mb-8">
                    <div className="rounded-2xl bg-gradient-to-br from-rose-500/10 via-zinc-900/80 to-zinc-900/50 border border-rose-500/30 overflow-hidden relative shadow-lg shadow-rose-500/5">
                        {/* Decorative background glow */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

                        <div className="p-4 md:p-6 border-b border-rose-500/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-rose-500/10 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/30 to-red-500/20 shadow-inner">
                                    <TrendingDown className="h-5 w-5 text-rose-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold font-serif text-white">Yearly Overview</h2>
                                    <p className="text-sm text-gray-500">Spending trends for {currentYear}</p>
                                </div>
                            </div>

                            {/* Avg/Month Stat - Centered */}
                            <div className="flex-1 flex justify-center">
                                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <TrendingDown className="h-4 w-4 text-red-400" />
                                    <div className="text-sm">
                                        <span className="text-gray-400">Avg/mo: </span>
                                        <span className="font-bold text-red-400 text-base">{currency}{yearlyAverages.avgMonthlyExpense.toFixed(0)}</span>
                                        <span className="text-gray-500 ml-1.5">({yearlyAverages.monthsWithExpense}mo)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Total Spent - Styled as chip */}
                                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30">
                                    <div className="text-sm">
                                        <span className="text-gray-400">{selectedYearlyCategories.length > 0 ? 'Filtered' : 'Total'}: </span>
                                        <span className="font-bold text-rose-400 text-lg">{currency}{totalYearlyExpense.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 md:gap-3">
                                    <Select value={yearlyXAxisMode} onValueChange={(v: any) => setYearlyXAxisMode(v)}>
                                        <SelectTrigger className="w-[100px] md:w-[120px] bg-zinc-800 border-zinc-700 rounded-xl text-xs md:text-sm">
                                            <SelectValue placeholder="X-Axis" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="w-[80px] md:w-[100px]">
                                        <Input
                                            type="number"
                                            placeholder="Y-Max"
                                            value={yearlyYAxisMax}
                                            onChange={(e) => setYearlyYAxisMax(e.target.value)}
                                            className="bg-zinc-800 border-zinc-700 rounded-xl text-xs md:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Filter - Only show when categories exist */}
                        {availableYearlyCategories.length > 0 && (
                            <div className="px-6 py-3 border-b border-rose-500/10 bg-zinc-900/50">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Tags className="h-4 w-4" />
                                        <span>Filter by category:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {availableYearlyCategories.map(category => {
                                            const isSelected = selectedYearlyCategories.includes(category);
                                            return (
                                                <button
                                                    key={category}
                                                    onClick={() => toggleYearlyCategory(category)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected
                                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                                                        }`}
                                                >
                                                    {category}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedYearlyCategories.length > 0 && (
                                        <button
                                            onClick={() => setSelectedYearlyCategories([])}
                                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-700 text-gray-300 hover:bg-zinc-600 transition-all"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="p-6">
                            <div className="h-[300px] w-full mt-4">
                                {isLoadingYearly ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : filteredYearlyData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <BarChart data={transformedYearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="yearExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                                                </linearGradient>
                                                <linearGradient id="yearIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                </linearGradient>
                                                <linearGradient id="yearNetWorthGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                                            <XAxis
                                                dataKey="name"
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => {
                                                    if (value >= 1000000) return `${currency}${(value / 1000000).toFixed(1)}M`;
                                                    if (value >= 1000) return `${currency}${(value / 1000).toFixed(0)}k`;
                                                    return `${currency}${value}`;
                                                }}
                                                domain={[0, yearlyYAxisMax ? parseInt(yearlyYAxisMax) : 'auto']}
                                                allowDataOverflow={true}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--popover))',
                                                    borderColor: 'hsl(var(--border))',
                                                    borderRadius: '0.5rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                }}
                                                formatter={(value: number, name: string) => [`${currency}${value.toFixed(2)}`, name]}
                                            />
                                            <Legend />
                                            {showIncome && (
                                                <Bar
                                                    dataKey="income"
                                                    name="Income"
                                                    fill="url(#yearIncomeGradient)"
                                                    radius={[6, 6, 0, 0]}
                                                    maxBarSize={50}
                                                />
                                            )}
                                            <Bar
                                                dataKey="expense"
                                                name="Expense"
                                                fill="url(#yearExpenseGradient)"
                                                radius={[6, 6, 0, 0]}
                                                maxBarSize={50}
                                            />
                                            {showNetWorth && (
                                                <Bar
                                                    dataKey="netWorth"
                                                    name="Net Worth"
                                                    fill="url(#yearNetWorthGradient)"
                                                    radius={[6, 6, 0, 0]}
                                                    maxBarSize={50}
                                                />
                                            )}
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        No yearly data available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
