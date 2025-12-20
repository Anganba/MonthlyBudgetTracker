import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, BarChart3, List, Edit } from "lucide-react";
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

    // 1. Identify all relevant categories (both from limits and transactions)
    const transactionCategories = new Set(transactions.map(t => t.category));
    const allCategories = new Set([
        ...Object.keys(limits),
        ...Array.from(transactionCategories).filter(c => !incomeCategories.includes(c))
    ]);

    // 2. Build data for each category
    const categoryData = Array.from(allCategories).map(catName => {
        const spent = transactions
            .filter(t => t.category === catName)
            .reduce((sum, t) => sum + t.actual, 0);

        // Use limit if set, otherwise fallback to sum of planned values (old behavior)
        const limit = limits[catName];
        const plannedSum = transactions
            .filter(t => t.category === catName)
            .reduce((sum, t) => sum + t.planned, 0);

        const total = (limit !== undefined && limit > 0) ? limit : plannedSum;

        return {
            name: catName,
            spent,
            total
        };
    }).filter(item => item.spent > 0 || item.total > 0).sort((a, b) => a.name.localeCompare(b.name)); // Only show if there's activity or a budget set, sorted alphabetically

    // Calculate total budget metrics
    const totalBudget = categoryData.reduce((sum, c) => sum + c.total, 0);
    const totalSpent = categoryData.reduce((sum, c) => sum + c.spent, 0);

    const handleRefresh = () => {
        refreshBudget();
    };

    return (
        <>
            <Card className="bg-card border-0 shadow-sm mt-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-baseline gap-2">
                        <CardTitle className="text-lg font-bold font-serif text-white">Monthly budget</CardTitle>
                        <span className="text-sm text-primary font-medium">{currency}{totalSpent.toFixed(0)}</span>
                        <span className="text-xs text-muted-foreground">/{currency}{totalBudget.toFixed(0)}</span>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#1c1c1c] border-white/10 text-white">
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
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {totalBudget === 0 ? (
                            <p className="text-sm text-muted-foreground">No budget limits set. Set a limit to track progress.</p>
                        ) : (
                            (() => {
                                const percent = Math.round((totalSpent / totalBudget) * 100);
                                const isOverBudget = percent > 100;

                                // Dynamic colors based on status
                                const progressColor = isOverBudget ? "bg-red-500" : "bg-primary";
                                const textColor = isOverBudget ? "text-red-500" : "text-white";

                                return (
                                    <div className="space-y-6">
                                        <div className="space-y-2 p-4 bg-secondary/20 rounded-xl border border-white/5">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className={`text-sm font-bold ${isOverBudget ? 'text-red-500' : 'text-muted-foreground'}`}>Overall Status</span>
                                                {isOverBudget && <span className="text-xs font-bold text-red-500">OVER BUDGET</span>}
                                            </div>
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-2xl font-bold text-white">{percent}%</span>
                                                <p className="text-xs text-muted-foreground text-right">
                                                    <span className={textColor}>{currency}{totalSpent.toLocaleString()}</span> / <span className="text-white">{currency}{totalBudget.toLocaleString()}</span>
                                                </p>
                                            </div>
                                            <Progress value={percent > 100 ? 100 : percent} indicatorClassName={progressColor} className="h-3 bg-secondary" />
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Category Breakdown</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                {categoryData.map((cat) => {
                                                    const percent = cat.total > 0 ? Math.round((cat.spent / cat.total) * 100) : 0;
                                                    const isOverBudget = percent > 100;
                                                    const Icon = getCategoryIcon(cat.name);

                                                    // Dynamic colors based on status
                                                    const iconColor = isOverBudget ? "text-red-500" : "text-primary";
                                                    const progressColor = isOverBudget ? "bg-red-500" : "bg-primary";
                                                    const textColor = isOverBudget ? "text-red-500" : "text-white";

                                                    return (
                                                        <div key={cat.name} className="space-y-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-secondary p-2 rounded-lg">
                                                                    <Icon className={`h-4 w-4 ${iconColor}`} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <h5 className={`font-semibold text-sm ${textColor}`}>{cat.name}</h5>
                                                                        <span className={`text-xs font-bold ${isOverBudget ? 'text-red-500' : 'text-muted-foreground'}`}>{percent}%</span>
                                                                    </div>
                                                                    <Progress value={percent > 100 ? 100 : percent} indicatorClassName={progressColor} className="h-1.5 bg-secondary" />
                                                                </div>
                                                            </div>
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
                </CardContent>
            </Card>
        </>
    );
}
