import React, { useMemo, useState } from "react";
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
} from "recharts";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths, isSameMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Calendar, TrendingDown, TrendingUp, PieChart as PieChartIcon, Target, Wallet, Tags, ArrowRightLeft } from "lucide-react";
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

    const { budget, isLoading: isLoadingBudget, yearlyStats, isLoadingYearly, monthlyStats, isLoadingMonthlyStats } = useBudget(currentMonthName, currentYear);
    const { wallets } = useWallets();

    const { goals, isLoading: isLoadingGoals } = useGoals();
    const currency = "$"; // consistent with app

    const [showIncome, setShowIncome] = useState(false);
    const [showExpense, setShowExpense] = useState(true);
    const [showTransfers, setShowTransfers] = useState(false);
    const [showNetWorth, setShowNetWorth] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedYearlyCategories, setSelectedYearlyCategories] = useState<string[]>([]);

    const handlePrevMonth = () => setDate(subMonths(date, 1));
    const handleNextMonth = () => setDate(addMonths(date, 1));

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
                                            formatter={(value: number) => [`${currency}${value.toFixed(2)}`, '']}
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
