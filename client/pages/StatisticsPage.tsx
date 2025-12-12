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
} from "recharts";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function StatisticsPage() {
    const [date, setDate] = useState(new Date());

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthName = monthNames[date.getMonth()];
    const currentYear = date.getFullYear();

    const { budget, isLoading: isLoadingBudget, yearlyStats, isLoadingYearly, monthlyStats, isLoadingMonthlyStats } = useBudget(currentMonthName, currentYear);



    const { goals, isLoading: isLoadingGoals } = useGoals();
    const currency = "$"; // consistent with app

    const [showIncome, setShowIncome] = useState(false);
    const [showExpense, setShowExpense] = useState(true);
    const [showSavings, setShowSavings] = useState(false);

    const handlePrevMonth = () => setDate(subMonths(date, 1));
    const handleNextMonth = () => setDate(addMonths(date, 1));

    // 1. Prepare Daily Trend Data (Use Optimized Server Data if available)
    const dailyData = useMemo(() => {
        if (monthlyStats?.dailyData) {
            // Server returns { day: 1, income: ..., expense: ..., savings: ... }
            // We need to map it to the Recharts format with full dates
            return monthlyStats.dailyData.map((d: any) => {
                const dateObj = new Date(currentYear, date.getMonth(), d.day);
                return {
                    date: format(dateObj, 'dd'),
                    fullDate: format(dateObj, 'MMM dd'),
                    income: d.income,
                    expense: d.expense,
                    savings: d.savings,
                };
            });
        }

        // Fallback or Initial Load (though isLoading should handle this)
        return [];
    }, [monthlyStats, currentYear, date]);

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

    if ((isLoadingBudget || isLoadingMonthlyStats) && !monthlyStats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // ... Render ...

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif">Statistics</h1>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-foreground min-w-[140px] text-center flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {currentMonthName} {currentYear}
                        </span>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={showIncome ? "default" : "outline"}
                        onClick={() => setShowIncome(!showIncome)}
                        className="h-8 border-dashed"
                    >
                        Income
                    </Button>
                    <Button
                        variant={showExpense ? "default" : "outline"}
                        onClick={() => setShowExpense(!showExpense)}
                        className="h-8 border-dashed"
                    >
                        Expenses
                    </Button>
                    <Button
                        variant={showSavings ? "default" : "outline"}
                        onClick={() => setShowSavings(!showSavings)}
                        className="h-8 border-dashed"
                    >
                        Savings
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Financial Flow (Area Chart) */}
                <Card className="col-span-1 lg:col-span-2 bg-card border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-card-foreground">Daily Financial Flow</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                    </CardContent>
                </Card>

                {/* Expense Breakdown (Pie Chart) */}
                <Card className="bg-card border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-card-foreground">Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                            formatter={(value: number) => [`${currency}${value.toFixed(2)}`, 'Amount']}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    No expense data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Goals Progress (Bar Chart) - Normalized to 100% */}
                <Card className="bg-card border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-card-foreground">Goals Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                                // Show REAL values from payload, not normalized bar values
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
                    </CardContent>
                </Card>
            </div>

            {/* Yearly Expense Overview - Moved to Bottom */}
            <div className="mt-8 mb-8">
                <Card className="bg-card border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-card-foreground">Yearly Expense Overview ({currentYear})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {isLoadingYearly ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : yearlyStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={yearlyStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis
                                            dataKey="name"
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
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                            formatter={(value: number) => [`${currency}${value.toFixed(2)}`, 'Expense']}
                                        />
                                        <Bar dataKey="expense" name="Expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    No yearly data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
