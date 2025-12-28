import React, { useMemo, useState } from "react";
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
import { ChevronLeft, ChevronRight, Calendar, TrendingDown, TrendingUp, PieChart as PieChartIcon, Target, Wallet } from "lucide-react";
import { Progress } from "@/components/ui/progress";

import { useWallets } from "@/hooks/use-wallets";

export default function StatisticsPage() {
    const [date, setDate] = useState(new Date());
    const [xAxisMode, setXAxisMode] = useState<'daily' | 'weekly'>('daily');
    const [yAxisMode, setYAxisMode] = useState<'standard' | 'cumulative'>('standard');
    const [yAxisMax, setYAxisMax] = useState<string>('');

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
    const [showSavings, setShowSavings] = useState(false);

    const handlePrevMonth = () => setDate(subMonths(date, 1));
    const handleNextMonth = () => setDate(addMonths(date, 1));

    // 1. Prepare Daily Trend Data (Use Optimized Server Data if available)
    const chartData = useMemo(() => {
        if (!monthlyStats?.dailyData) return [];

        let data = monthlyStats.dailyData.map((d: any) => {
            const dateObj = new Date(currentYear, date.getMonth(), d.day);
            return {
                day: d.day,
                date: format(dateObj, 'dd'),
                fullDate: format(dateObj, 'MMM dd'),
                week: Math.ceil(d.day / 7),
                income: d.income,
                expense: d.expense,
                savings: d.savings,
            };
        });

        // X-Axis Aggregation: Weekly
        if (xAxisMode === 'weekly') {
            const weeklyMap = new Map();
            data.forEach((d: any) => {
                const key = `Week ${d.week}`;
                if (!weeklyMap.has(key)) {
                    weeklyMap.set(key, {
                        date: key,
                        fullDate: key,
                        income: 0,
                        expense: 0,
                        savings: 0
                    });
                }
                const weekData = weeklyMap.get(key);
                weekData.income += d.income;
                weekData.expense += d.expense;
                weekData.savings += d.savings;
            });
            data = Array.from(weeklyMap.values());
        }

        // Y-Axis Transformation: Cumulative
        if (yAxisMode === 'cumulative') {
            let runningIncome = 0;
            let runningExpense = 0;
            let runningSavings = 0;

            data = data.map((d: any) => {
                runningIncome += d.income;
                runningExpense += d.expense;
                runningSavings += d.savings;
                return {
                    ...d,
                    income: runningIncome,
                    expense: runningExpense,
                    savings: runningSavings
                };
            });
        }

        return data;
    }, [monthlyStats, currentYear, date, xAxisMode, yAxisMode]);

    // 2. Prepare Pie Data (Expenses) - Use Optimized Server Data
    const pieData = useMemo(() => {
        if (monthlyStats?.pieData) return monthlyStats.pieData;
        return [];
    }, [monthlyStats]);

    // Colors for Pie Chart - Using Theme Variables
    const pieColors = [
        'hsl(var(--chart-1))', // Neon Green
        'hsl(var(--chart-2))', // Teal
        'hsl(var(--chart-3))', // Purple
        'hsl(var(--chart-4))', // Pink
        'hsl(var(--chart-5))', // Orange
        '#3b82f6', // Blue
        '#6366f1', // Indigo
        '#a855f7', // Purple-600
    ];

    // 3. Prepare Goals Data
    const goalsData = useMemo(() => {
        if (!goals) return [];
        return goals.map(g => {
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

    const totalYearlyExpense = useMemo(() => {
        if (!yearlyStats) return 0;
        return yearlyStats.reduce((acc: number, curr: any) => acc + (curr.expense || 0), 0);
    }, [yearlyStats]);

    if ((isLoadingBudget || isLoadingMonthlyStats) && !monthlyStats) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-8 relative overflow-hidden">
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
                                variant={showSavings ? "default" : "outline"}
                                onClick={() => setShowSavings(!showSavings)}
                                className={`h-10 rounded-xl ${showSavings ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border-zinc-700 text-gray-400 hover:text-white hover:border-blue-500/50'}`}
                            >
                                <Target className="h-4 w-4 mr-1" /> Savings
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Financial Flow (Area Chart) */}
                    <div className="col-span-1 lg:col-span-2 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-zinc-900/80 to-zinc-900/50 border border-emerald-500/30 overflow-hidden shadow-lg shadow-emerald-500/5">
                        <div className="p-6 border-b border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/10 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/20 shadow-inner">
                                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-semibold font-serif text-white">Daily Financial Flow</h2>
                            </div>
                            <div className="flex gap-3">
                                <Select value={xAxisMode} onValueChange={(v: any) => setXAxisMode(v)}>
                                    <SelectTrigger className="w-[120px] bg-zinc-800 border-zinc-700 rounded-xl">
                                        <SelectValue placeholder="X-Axis" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={yAxisMode} onValueChange={(v: any) => setYAxisMode(v)}>
                                    <SelectTrigger className="w-[120px] bg-zinc-800 border-zinc-700 rounded-xl">
                                        <SelectValue placeholder="Y-Axis" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="cumulative">Cumulative</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="w-[100px]">
                                    <Input
                                        type="number"
                                        placeholder="Y-Max"
                                        value={yAxisMax}
                                        onChange={(e) => setYAxisMax(e.target.value)}
                                        className="bg-zinc-800 border-zinc-700 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
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
                                        />
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
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
                                        {showSavings && (
                                            <Area
                                                type="monotone"
                                                dataKey="savings"
                                                name="Savings"
                                                stroke="hsl(var(--chart-2))"
                                                fillOpacity={1}
                                                fill="url(#colorSavings)"
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
                                    <ResponsiveContainer width="100%" height="100%">
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
                                                    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name } = props;
                                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

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

                    {/* Goals Progress (Bar Chart) - Right Side */}
                    <div className="col-span-1 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-900/50 border border-amber-500/30 overflow-hidden shadow-lg shadow-amber-500/5">
                        <div className="p-6 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/20 shadow-inner">
                                    <Target className="h-5 w-5 text-amber-400" />
                                </div>
                                <h2 className="text-xl font-semibold font-serif text-white">Goals Progress</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="h-[300px] w-full">
                                {goalsData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            layout="vertical"
                                            data={goalsData}
                                            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                                        >
                                            <XAxis type="number" domain={[0, 100]} hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                                formatter={(value: number, name: string, props: any) => {
                                                    const realValue = name === 'Saved' ? props.payload.saved : props.payload.remaining;
                                                    if (name === 'Saved') return [`${currency}${realValue} (${props.payload.percent}%)`, name];
                                                    return [`${currency}${realValue}`, name];
                                                }}
                                            />
                                            <Bar dataKey="barSaved" name="Saved" stackId="a" radius={[4, 0, 0, 4]}>
                                                {goalsData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                                {/* Label List rendered manually via Content */}
                                                <LabelList content={renderSavedLabel} />
                                            </Bar>
                                            <Bar dataKey="barRemaining" name="Remaining" stackId="a" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]}>
                                                <LabelList content={renderRemainingLabel} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        No goals set
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

                        <div className="p-6 border-b border-rose-500/20 flex flex-row items-center justify-between bg-gradient-to-r from-rose-500/10 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/30 to-red-500/20 shadow-inner">
                                    <TrendingDown className="h-5 w-5 text-rose-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold font-serif text-white">Yearly Overview</h2>
                                    <p className="text-sm text-gray-500">Spending trends for {currentYear}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold block text-red-400">{currency}{totalYearlyExpense.toFixed(2)}</span>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Spent</span>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="h-[300px] w-full mt-4">
                                {isLoadingYearly ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : yearlyStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={yearlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="yearExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
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
                                                tickFormatter={(value) => `${currency}${value}`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--popover))',
                                                    borderColor: 'hsl(var(--border))',
                                                    borderRadius: '0.5rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                }}
                                                itemStyle={{ color: 'hsl(var(--destructive))', fontWeight: 600 }}
                                                formatter={(value: number) => [`${currency}${value.toFixed(2)}`, 'Expense']}
                                            />
                                            <Bar
                                                dataKey="expense"
                                                name="Expense"
                                                fill="url(#yearExpenseGradient)"
                                                radius={[6, 6, 0, 0]}
                                                maxBarSize={50}
                                            />
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
