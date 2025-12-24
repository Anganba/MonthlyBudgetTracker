import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, BarChart3, List, Edit, PieChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BudgetMonth, Transaction } from "@shared/api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { getCategoryIcon } from "@/lib/category-icons";

interface BudgetStatusProps {
    currency?: string;
    budget: BudgetMonth | null | undefined;
    refreshBudget: () => void;
}

export function BudgetStatus({ currency = '$', budget, refreshBudget }: BudgetStatusProps) {
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

        const total = (limit !== undefined && limit > 0) ? limit : plannedSum;

        return { name: catName, spent, total };
    }).filter(item => item.spent > 0 || item.total > 0).sort((a, b) => a.name.localeCompare(b.name));

    const totalBudget = categoryData.reduce((sum, c) => sum + c.total, 0);
    const totalSpent = categoryData.reduce((sum, c) => sum + c.spent, 0);

    return (
        <div className="rounded-2xl bg-zinc-900/50 border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/20">
                        <PieChart className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-lg font-bold font-serif text-white">Monthly budget</h2>
                        <span className="text-sm text-primary font-medium">{currency}{totalSpent.toFixed(0)}</span>
                        <span className="text-xs text-gray-500">/{currency}{totalBudget.toFixed(0)}</span>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white rounded-xl">
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
            <div className="p-4">
                {totalBudget === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No budget limits set. Set a limit to track progress.</p>
                ) : (
                    (() => {
                        const percent = Math.round((totalSpent / totalBudget) * 100);
                        const isOverBudget = percent > 100;
                        const progressColor = isOverBudget ? "bg-red-500" : "bg-primary";

                        return (
                            <div className="space-y-6">
                                {/* Overall Status */}
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className={`text-xs font-medium uppercase tracking-wider ${isOverBudget ? 'text-red-400' : 'text-gray-500'}`}>
                                            Overall Status
                                        </span>
                                        {isOverBudget && <span className="text-xs font-bold text-red-400">OVER BUDGET</span>}
                                    </div>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className={`text-3xl font-bold ${isOverBudget ? 'text-red-400' : 'text-white'}`}>{percent}%</span>
                                        <p className="text-xs text-gray-500">
                                            <span className={isOverBudget ? 'text-red-400' : 'text-white'}>{currency}{totalSpent.toLocaleString()}</span>
                                            {' / '}
                                            <span className="text-white">{currency}{totalBudget.toLocaleString()}</span>
                                        </p>
                                    </div>
                                    <Progress
                                        value={percent > 100 ? 100 : percent}
                                        indicatorClassName={progressColor}
                                        className="h-3 bg-white/10"
                                    />
                                </div>

                                {/* Category Breakdown */}
                                <div className="space-y-3">
                                    <h4 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Category Breakdown</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {categoryData.map((cat) => {
                                            const catPercent = cat.total > 0 ? Math.round((cat.spent / cat.total) * 100) : 0;
                                            const isCatOver = catPercent > 100;
                                            const Icon = getCategoryIcon(cat.name);

                                            return (
                                                <div key={cat.name} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className={`p-1.5 rounded-lg ${isCatOver ? 'bg-red-500/20' : 'bg-white/10'}`}>
                                                            <Icon className={`h-3.5 w-3.5 ${isCatOver ? 'text-red-400' : 'text-primary'}`} />
                                                        </div>
                                                        <span className={`text-sm font-medium truncate ${isCatOver ? 'text-red-400' : 'text-white'}`}>
                                                            {cat.name}
                                                        </span>
                                                        <span className={`text-xs font-bold ml-auto ${isCatOver ? 'text-red-400' : 'text-gray-500'}`}>
                                                            {catPercent}%
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={catPercent > 100 ? 100 : catPercent}
                                                        indicatorClassName={isCatOver ? "bg-red-500" : "bg-primary"}
                                                        className="h-1.5 bg-white/10"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                )}
            </div>
        </div>
    );
}
