import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, BarChart3, List, Edit, PieChart, ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle, Zap, Settings2, CheckSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BudgetMonth, Transaction } from "@shared/api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

    const incomeCategories = ['Paycheck', 'Bonus', 'Savings', 'Debt Added', 'income', 'Transfer', 'Side Hustle', 'Freelance', 'Gifts Received', 'Refund', 'Loan Repaid'];

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
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const budgetMonthIndex = budget ? monthNames.indexOf(budget.month) : new Date().getMonth();
    const budgetYear = budget?.year || new Date().getFullYear();

    const now = new Date();
    const isCurrentMonth = budgetMonthIndex === now.getMonth() && budgetYear === now.getFullYear();
    const isFutureMonth = (budgetYear > now.getFullYear()) || (budgetYear === now.getFullYear() && budgetMonthIndex > now.getMonth());

    const daysInBudgetMonth = new Date(budgetYear, budgetMonthIndex + 1, 0).getDate();

    /* 
       Calculate days remaining:
       - If current month: Days in month - current day
       - If future month: All days in month
       - If past month: 0 (or technically N/A, so daily budget is 0)
    */
    let daysRemaining = 0;
    if (isCurrentMonth) {
        daysRemaining = daysInBudgetMonth - now.getDate();
    } else if (isFutureMonth) {
        daysRemaining = daysInBudgetMonth;
    }

    const dailyBudget = daysRemaining > 0 ? remaining / daysRemaining : 0;
    const avgDailySpending = (isCurrentMonth && now.getDate() > 0) ? totalSpent / now.getDate() : 0;

    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
    const [pinnedCategories, setPinnedCategories] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('pinned_categories');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Temporary state for the dialog
    const [tempPinned, setTempPinned] = useState<string[]>([]);

    const openCustomize = () => {
        setTempPinned([...pinnedCategories]);
        setIsCustomizeOpen(true);
    };

    const togglePin = (catName: string) => {
        setTempPinned(prev => {
            if (prev.includes(catName)) {
                return prev.filter(c => c !== catName);
            } else {
                if (prev.length >= 4) return prev; // Max 4
                return [...prev, catName];
            }
        });
    };

    const savePins = () => {
        setPinnedCategories(tempPinned);
        localStorage.setItem('pinned_categories', JSON.stringify(tempPinned));
        setIsCustomizeOpen(false);
    };

    const clearPins = () => {
        setTempPinned([]);
        setPinnedCategories([]);
        localStorage.removeItem('pinned_categories');
        setIsCustomizeOpen(false);
    };

    // Calculate display data
    const INITIAL_DISPLAY_COUNT = 4;
    let displayedCategories = categoryData.slice(0, INITIAL_DISPLAY_COUNT);

    if (pinnedCategories.length > 0) {
        // Collect pinned objects
        const pinnedObjs = categoryData.filter(c => pinnedCategories.includes(c.name));

        // If we found pinned categories, use them.
        if (pinnedObjs.length > 0) {
            displayedCategories = pinnedObjs;
        }

        // Note: usage of strictly the pinned categories if present, otherwise default to top 4.
    }

    const hiddenCount = categoryData.length - displayedCategories.length;

    // Recalculate quick stats logic is separate above, but safe to keep as is.
    // However, `percent`, `isOverBudget` etc are calculated inside the render IIFE below.
    // We need to ensure those vars are available or logic is consistent. 
    // They are inside the `(() => {` block so they are fine.

    return (
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 via-zinc-900/80 to-zinc-900/50 border border-cyan-500/30 overflow-hidden shadow-lg shadow-cyan-500/5 hover:shadow-cyan-500/10 transition-shadow flex flex-col">
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
                        const isLimitReached = percent === 100;
                        const isWarning = percent > 85 && percent < 100;
                        const progressColor = (isOverBudget || isLimitReached) ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-primary";

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
                                        <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${(isOverBudget || isLimitReached) ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-gray-500'}`}>
                                            Overall Status
                                        </span>
                                        {isOverBudget && <span className="text-[10px] md:text-xs font-bold text-red-400 animate-pulse">OVER BUDGET</span>}
                                        {isLimitReached && <span className="text-[10px] md:text-xs font-bold text-red-400">⚠️ LIMIT REACHED</span>}
                                        {isWarning && <span className="text-[10px] md:text-xs font-bold text-yellow-400">⚠️ ALMOST AT LIMIT</span>}
                                    </div>
                                    <div className="flex justify-between items-end mb-2 md:mb-3">
                                        <span
                                            className={`text-2xl md:text-3xl font-bold ${(isOverBudget || isLimitReached) ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-primary'}`}
                                            style={{
                                                textShadow: (isOverBudget || isLimitReached)
                                                    ? '0 0 10px rgba(248, 113, 113, 0.6), 0 0 20px rgba(248, 113, 113, 0.4), 0 0 30px rgba(248, 113, 113, 0.2)'
                                                    : isWarning
                                                        ? '0 0 10px rgba(250, 204, 21, 0.6), 0 0 20px rgba(250, 204, 21, 0.4), 0 0 30px rgba(250, 204, 21, 0.2)'
                                                        : '0 0 10px rgba(163, 230, 53, 0.6), 0 0 20px rgba(163, 230, 53, 0.4), 0 0 30px rgba(163, 230, 53, 0.2)'
                                            }}
                                        >
                                            {percent}%
                                        </span>
                                        <p className="text-sm md:text-base font-semibold">
                                            <span
                                                className={`${(isOverBudget || isLimitReached) ? 'text-red-400' : 'text-cyan-400'}`}
                                                style={{ textShadow: (isOverBudget || isLimitReached) ? '0 0 8px rgba(248, 113, 113, 0.5)' : '0 0 8px rgba(34, 211, 238, 0.5)' }}
                                            >
                                                {currency}{totalSpent.toLocaleString()}
                                            </span>
                                            <span className="text-gray-500"> / </span>
                                            <span
                                                className="text-primary"
                                                style={{ textShadow: '0 0 8px rgba(163, 230, 53, 0.5)' }}
                                            >
                                                {currency}{totalBudget.toLocaleString()}
                                            </span>
                                        </p>
                                    </div>
                                    <Progress
                                        value={percent > 100 ? 100 : percent}
                                        indicatorClassName={`${progressColor} transition-all duration-500`}
                                        className="h-2 md:h-3 bg-white/10"
                                    />
                                    {remaining > 0 && (
                                        <p
                                            className="text-xs md:text-sm text-emerald-400 mt-2 font-medium"
                                            style={{ textShadow: '0 0 8px rgba(52, 211, 153, 0.4)' }}
                                        >
                                            <span className="font-bold">{currency}{remaining.toLocaleString()}</span> remaining • <span className="font-bold">{daysRemaining}</span> days left
                                        </p>
                                    )}
                                </div>

                                {/* Category Breakdown */}
                                <div className="space-y-2 md:space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-semibold">Category Breakdown</h4>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 text-gray-600 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full"
                                                onClick={openCustomize}
                                                title="Customize visible categories"
                                            >
                                                <Settings2 className="h-3 w-3" />
                                            </Button>
                                        </div>
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

                                    {/* View More Link */}
                                    {categoryData.length > INITIAL_DISPLAY_COUNT && (
                                        <Link to="/recurring" className="mt-2 block">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full h-8 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-xl"
                                            >
                                                Show {hiddenCount} more categories
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })()
                )}
            </div>
            {/* Added Dialog at the end */}
            <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
                <DialogContent className="sm:max-w-[400px] bg-zinc-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle>Customize Monthly Budget</DialogTitle>
                        <DialogDescription>
                            Select up to 4 categories to display in the monthly budget card.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {categoryData.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No categories found with transactions or limits.</p>}
                        {categoryData.map(cat => (
                            <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                <Label htmlFor={`cat-${cat.name}`} className="flex items-center gap-3 flex-1 cursor-pointer">
                                    <Checkbox
                                        id={`cat-${cat.name}`}
                                        checked={tempPinned.includes(cat.name)}
                                        onCheckedChange={() => togglePin(cat.name)}
                                        disabled={!tempPinned.includes(cat.name) && tempPinned.length >= 4}
                                    />
                                    <span className="text-sm font-medium">{cat.name}</span>
                                </Label>
                                <span className="text-xs text-gray-500">${cat.spent.toLocaleString()} / ${cat.total.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="flex justify-between gap-2 sm:justify-between">
                        <Button variant="ghost" size="sm" onClick={clearPins} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            Reset to Default
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsCustomizeOpen(false)} className="border-zinc-700">
                                Cancel
                            </Button>
                            <Button size="sm" onClick={savePins} className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                                Save Changes
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
