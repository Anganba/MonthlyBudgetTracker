import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, BarChart3, List, Edit, PieChart, ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BudgetMonth, Transaction } from "@shared/api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { getCategoryIcon } from "@/lib/category-icons";

interface BudgetStatusProps {
    currency?: string;
    budget: BudgetMonth | null | undefined;
    refreshBudget: () => void;
    showAllCategories: boolean;
    onToggleCategories: (show: boolean) => void;
}

export function BudgetStatus({ currency = '$', budget, refreshBudget, showAllCategories, onToggleCategories }: BudgetStatusProps) {
    const transactions = budget?.transactions || [];
    const limits = (budget?.categoryLimits as Record<string, number>) || {};

    const incomeCategories = ['Paycheck', 'Bonus', 'Savings', 'Debt Added', 'income', 'Transfer'];

    const transactionCategories = new Set(transactions.map(t => t.category));
    const allCategories = new Set([
        ...Object.keys(limits),
        ...Array.from(transactionCategories).filter(c => !incomeCategories.includes(c))
    ]);

    const categoryData = Array.from(allCategories).map(catName => {
        const spent = transactions
            .filter(t => t.category === catName)
            .reduce((sum, t) => sum + t.actual, 0);

        const limit = limits[catName];
        const plannedSum = transactions
            .filter(t => t.category === catName)
            .reduce((sum, t) => sum + t.planned, 0);

        // Use explicit limit if set, otherwise fall back to planned amounts
        const total = (limit !== undefined && limit > 0) ? limit : plannedSum;

        return { name: catName, spent, total };
    }).filter(item => item.spent > 0 || item.total > 0).sort((a, b) => b.spent - a.spent); // Sort by most spent

    const totalBudget = categoryData.reduce((sum, c) => sum + c.total, 0);
    const totalSpent = categoryData.reduce((sum, c) => sum + c.spent, 0);

    // Quick Stats Calculations
    const topCategory = categoryData.length > 0 ? categoryData[0] : null;
    const overBudgetCount = categoryData.filter(c => c.total > 0 && c.spent > c.total).length;
    const remaining = totalBudget - totalSpent;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const daysRemaining = daysInMonth - currentDay;
    const dailyBudget = daysRemaining > 0 ? remaining / daysRemaining : 0;
    const avgDailySpending = currentDay > 0 ? totalSpent / currentDay : 0;

    // Categories to display (6 by default, all when expanded)
    const INITIAL_DISPLAY_COUNT = 6;
    const displayedCategories = showAllCategories ? categoryData : categoryData.slice(0, INITIAL_DISPLAY_COUNT);
    const hiddenCount = categoryData.length - INITIAL_DISPLAY_COUNT;

    return (
        <div className="h-full rounded-2xl bg-gradient-to-br from-cyan-500/10 via-zinc-900/80 to-zinc-900/50 border border-cyan-500/30 overflow-hidden shadow-lg shadow-cyan-500/5 hover:shadow-cyan-500/10 transition-shadow flex flex-col">
            <div className="p-3 md:p-4 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-transparent">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 shadow-inner">
                        <PieChart className="h-3.5 w-3.5 md:h-4 md:w-4 text-cyan-400" />
                    </div>
                    <div className="flex items-baseline gap-1.5 md:gap-2">
                        <h2 className="text-base md:text-lg font-bold font-serif text-white">Monthly budget</h2>
                        <span className="text-xs md:text-sm text-cyan-400 font-medium">{currency}{totalSpent.toFixed(0)}</span>
                        <span className="text-[10px] md:text-xs text-gray-500">/{currency}{totalBudget.toFixed(0)}</span>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-gray-500 hover:text-white rounded-lg md:rounded-xl">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-white/10">
                        <Link to="/recurring">
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit Limits</span>
                            </DropdownMenuItem>
                        </Link>
                        <Link to="/goals">
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                                <Plus className="mr-2 h-4 w-4" />
                                <span>Manage Goals</span>
                            </DropdownMenuItem>
                        </Link>
                        <Link to="/statistics">
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                <span>Analyze Expenses</span>
                            </DropdownMenuItem>
                        </Link>
                        <Link to="/transactions">
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                                <List className="mr-2 h-4 w-4" />
                                <span>View Transactions</span>
                            </DropdownMenuItem>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="p-3 md:p-4">
                {totalBudget === 0 ? (
                    <div className="text-center py-6">
                        <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-3">
                            <PieChart className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm text-gray-400 mb-2">No budget limits set</p>
                        <p className="text-xs text-gray-500">Set category limits to track your spending</p>
                    </div>
                ) : (
                    (() => {
                        const percent = Math.round((totalSpent / totalBudget) * 100);
                        const isOverBudget = percent > 100;
                        const isWarning = percent >= 80 && percent <= 100;
                        const progressColor = isOverBudget ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-primary";

                        return (
                            <div className="space-y-4 md:space-y-5">
                                {/* Quick Stats Row */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-2 md:p-3 bg-gradient-to-br from-rose-500/15 to-rose-500/5 rounded-xl border border-rose-500/30 shadow-lg shadow-rose-500/5">
                                        <div className="flex items-center gap-1 mb-1">
                                            <TrendingDown className="h-3 w-3 text-rose-400" />
                                            <span className="text-[10px] md:text-xs text-rose-400 font-medium">Top Expense</span>
                                        </div>
                                        <p className="text-xs md:text-sm font-bold text-white truncate">{topCategory?.name || '-'}</p>
                                    </div>
                                    <div className="p-2 md:p-3 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 rounded-xl border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Zap className="h-3 w-3 text-emerald-400" />
                                            <span className="text-[10px] md:text-xs text-emerald-400 font-medium">Daily Budget</span>
                                        </div>
                                        <p className="text-xs md:text-sm font-bold text-white">{currency}{Math.round(dailyBudget).toLocaleString()}</p>
                                    </div>
                                    <div className={`p-2 md:p-3 rounded-xl border ${overBudgetCount > 0 ? 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20' : 'bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20'}`}>
                                        <div className="flex items-center gap-1 mb-1">
                                            <AlertTriangle className={`h-3 w-3 ${overBudgetCount > 0 ? 'text-red-400' : 'text-gray-400'}`} />
                                            <span className={`text-[10px] md:text-xs font-medium ${overBudgetCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>Over Limit</span>
                                        </div>
                                        <p className={`text-xs md:text-sm font-bold ${overBudgetCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>{overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'}</p>
                                    </div>
                                </div>

                                {/* Overall Status */}
                                <div className="p-3 md:p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${isOverBudget ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-gray-500'}`}>
                                            Overall Status
                                        </span>
                                        {isOverBudget && <span className="text-[10px] md:text-xs font-bold text-red-400 animate-pulse">OVER BUDGET</span>}
                                        {isWarning && !isOverBudget && <span className="text-[10px] md:text-xs font-bold text-yellow-400">⚠️ ALMOST AT LIMIT</span>}
                                    </div>
                                    <div className="flex justify-between items-end mb-2 md:mb-3">
                                        <span className={`text-2xl md:text-3xl font-bold ${isOverBudget ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white'}`}>{percent}%</span>
                                        <p className="text-[10px] md:text-xs text-gray-500">
                                            <span className={isOverBudget ? 'text-red-400' : 'text-white'}>{currency}{totalSpent.toLocaleString()}</span>
                                            {' / '}
                                            <span className="text-white">{currency}{totalBudget.toLocaleString()}</span>
                                        </p>
                                    </div>
                                    <Progress
                                        value={percent > 100 ? 100 : percent}
                                        indicatorClassName={`${progressColor} transition-all duration-500`}
                                        className="h-2 md:h-3 bg-white/10"
                                    />
                                    {remaining > 0 && (
                                        <p className="text-[10px] md:text-xs text-gray-500 mt-2">
                                            {currency}{remaining.toLocaleString()} remaining • {daysRemaining} days left
                                        </p>
                                    )}
                                </div>

                                {/* Category Breakdown */}
                                <div className="space-y-2 md:space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-semibold">Category Breakdown</h4>
                                        <span className="text-[10px] md:text-xs text-gray-600">{categoryData.length} categories</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                                        {displayedCategories.map((cat) => {
                                            const catPercent = cat.total > 0 ? Math.round((cat.spent / cat.total) * 100) : 0;
                                            const isCatOver = catPercent > 100;
                                            const isCatWarning = catPercent >= 80 && catPercent <= 100;
                                            const Icon = getCategoryIcon(cat.name);

                                            return (
                                                <div key={cat.name} className="p-2 md:p-2.5 bg-white/5 rounded-lg md:rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                    <div className="flex items-center gap-1.5 md:gap-2 mb-1.5">
                                                        <div className={`p-1 md:p-1.5 rounded-md ${isCatOver ? 'bg-red-500/20' : isCatWarning ? 'bg-yellow-500/20' : 'bg-white/10'}`}>
                                                            <Icon className={`h-3 w-3 ${isCatOver ? 'text-red-400' : isCatWarning ? 'text-yellow-400' : 'text-cyan-400'}`} />
                                                        </div>
                                                        <span className={`text-xs md:text-sm font-medium truncate flex-1 ${isCatOver ? 'text-red-400' : 'text-white'}`}>
                                                            {cat.name}
                                                        </span>
                                                        <span className={`text-[10px] md:text-xs font-bold ${isCatOver ? 'text-red-400' : isCatWarning ? 'text-yellow-400' : 'text-gray-500'}`}>
                                                            {catPercent}%
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={catPercent > 100 ? 100 : catPercent}
                                                        indicatorClassName={`${isCatOver ? "bg-red-500" : isCatWarning ? "bg-yellow-500" : "bg-cyan-500"} transition-all duration-300`}
                                                        className="h-1 md:h-1.5 bg-white/10"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Show More/Less Toggle */}
                                    {categoryData.length > INITIAL_DISPLAY_COUNT && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onToggleCategories(!showAllCategories)}
                                            className="w-full h-8 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-xl"
                                        >
                                            {showAllCategories ? (
                                                <>
                                                    <ChevronUp className="h-3 w-3 mr-1" />
                                                    Show less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-3 w-3 mr-1" />
                                                    Show {hiddenCount} more categories
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })()
                )}
            </div>
        </div>
    );
}
