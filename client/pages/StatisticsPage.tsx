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

    const { budget, isLoading: isLoadingBudget } = useBudget(currentMonthName, currentYear);
    const { goals, isLoading: isLoadingGoals } = useGoals();
    const currency = "$"; // consistent with app

    const [activeMetric, setActiveMetric] = useState("all");

    const handlePrevMonth = () => setDate(subMonths(date, 1));
    const handleNextMonth = () => setDate(addMonths(date, 1));

    // 1. Prepare Daily Trend Data
    const dailyData = useMemo(() => {
        // Determine start/end of the SELECTED month
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        const days = eachDayOfInterval({ start, end });

        // Aggregate transactions from budget if it exists
        const incomeCategories = ['Paycheck', 'Bonus', 'Debt Added', 'income'];
        const transactions = budget?.transactions || [];

        return days.map(day => {
            let income = 0;
            let expense = 0;
            let savings = 0;

            transactions.forEach(t => {
                const tDate = new Date(t.date);
                if (isSameDay(tDate, day)) {
                    if (t.category === 'Savings') {
                        savings += t.actual;
                    } else if (incomeCategories.includes(t.category)) {
                        income += t.actual;
                    } else {
                        expense += t.actual;
                    }
                }
            });

            return {
                date: format(day, 'dd'),
                fullDate: format(day, 'MMM dd'),
                income,
                expense,
                savings,
            };
        });
    }, [budget, date]);

    // 2. Prepare Pie Data (Expenses)
    const pieData = useMemo(() => {
        if (!budget) return [];
        const incomeCategories = ['Paycheck', 'Bonus', 'Debt Added', 'income'];
        const categoryMap = new Map<string, number>();

        budget.transactions.forEach(t => {
            if (!incomeCategories.includes(t.category) && t.category !== 'Savings' && t.actual > 0) {
                const current = categoryMap.get(t.category) || 0;
                categoryMap.set(t.category, current + t.actual);
            }
        });

        return Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [budget]);

    // Colors for Pie Chart
    const pieColors = [
        '#a3e635', // lime-400
        '#34d399', // emerald-400
        '#22d3ee', // cyan-400
        '#818cf8', // indigo-400
        '#c084fc', // purple-400
        '#f472b6', // pink-400
        '#fbbf24', // amber-400
        '#f87171', // red-400
    ];

    // 3. Prepare Goals Data
    const goalsData = useMemo(() => {
        return goals.map(g => {
            const current = Number(g.currentAmount);
            const target = Number(g.targetAmount);
            const percent = target > 0 ? (current / target) * 100 : 0;
            return {
                name: g.name,
                saved: current,
                target: target,
                remaining: Math.max(0, target - current),
                percent: Math.round(percent),
                color: g.color || '#bef264'
            };
        });
    }, [goals]);

    // Custom Label with Connector Line
    const renderCustomizedLabel = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name } = props;
        const RADIAN = Math.PI / 180;
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        const sx = cx + (outerRadius) * cos;
        const sy = cy + (outerRadius) * sin;
        const mx = cx + (outerRadius + 20) * cos;
        const my = cy + (outerRadius + 20) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * 22;
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';

        if (percent < 0.05) return null;

        const color = pieColors[index % pieColors.length];

        return (
            <g>
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={color} fill="none" />
                <circle cx={ex} cy={ey} r={2} fill={color} stroke="none" />
                <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#fff" fontSize={12} dominantBaseline="central">
                    {`${name} ${(percent * 100).toFixed(0)}%`}
                </text>
            </g>
        );
    };

    // Label for Saved Bar (visible only if bar is wide enough)
    const renderSavedLabel = (props: any) => {
        const { x, y, width, height, payload } = props;
        const p = payload ? payload.percent : 0;
        if (width < 40) return null;
        return (
            <text x={x + width - 5} y={y + height / 2 + 5} textAnchor="end" fill="#000" fontSize={12} fontWeight="bold">
                {p}%
            </text>
        );
    };

    // Label for Remaining Bar (visible if Saved bar is too small)
    const renderRemainingLabel = (props: any) => {
        const { x, y, height, payload } = props;
        const p = payload ? payload.percent : 0;

        // Show here if saved bar label is hidden (width < 40)
        // Since we don't have width here, we use percentage proxy.
        // Assuming ~40px is around 15% of width?
        if (p >= 15) return null;

        return (
            <text x={x + 5} y={y + height / 2 + 5} textAnchor="start" fill="#bef264" fontSize={12} fontWeight="bold">
                {p}%
            </text>
        );
    };

    if (isLoadingBudget && !budget) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif">Statistics</h1>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-white min-w-[140px] text-center flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {currentMonthName} {currentYear}
                        </span>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Select value={activeMetric} onValueChange={setActiveMetric}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="View Metric" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Metrics</SelectItem>
                        <SelectItem value="income">Income Only</SelectItem>
                        <SelectItem value="expense">Expense Only</SelectItem>
                        <SelectItem value="savings">Savings Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Main Trend Chart */}
                <Card className="col-span-1 lg:col-span-2 bg-card border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Daily Financial Flow</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#666' }} />
                                <YAxis stroke="#666" tick={{ fill: '#666' }} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                {(activeMetric === 'all' || activeMetric === 'income') && (
                                    <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                                )}
                                {(activeMetric === 'all' || activeMetric === 'expense') && (
                                    <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Expenses" />
                                )}
                                {(activeMetric === 'all' || activeMetric === 'savings') && (
                                    <Area type="monotone" dataKey="savings" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSavings)" name="Savings" />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Expense Composition */}
                <Card className="bg-card border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 80, left: 80, bottom: 0 }}>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={renderCustomizedLabel}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                        formatter={(value: number) => [`${currency}${value.toFixed(2)}`, 'Amount']}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                No expense data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Goal Progress Bar Chart */}
                <Card className="bg-card border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Goals Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {goalsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={goalsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#fff', fontSize: 12, fontWeight: 500 }} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                        formatter={(value: number, name: string, props: any) => {
                                            if (name === 'Saved') return [`${currency}${value} (${props.payload.percent}%)`, name];
                                            return [`${currency}${value}`, name];
                                        }}
                                    />
                                    {/* Saved Bar with Label - Neon Green */}
                                    <Bar dataKey="saved" stackId="a" fill="#bef264" radius={[4, 0, 0, 4]} name="Saved" label={renderSavedLabel}>
                                        {
                                            goalsData.map((entry, index) => (
                                                <Cell key={`cell-saved-${index}`} fill={entry.percent >= 100 ? '#10b981' : '#bef264'} />
                                            ))
                                        }
                                    </Bar>
                                    {/* Remaining Bar - Lighter Grey for visibility */}
                                    <Bar dataKey="remaining" stackId="a" fill="#4b5563" radius={[0, 4, 4, 0]} name="Remaining" label={renderRemainingLabel} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                No goals set
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
