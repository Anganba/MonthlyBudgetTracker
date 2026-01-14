import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useBudget } from "@/hooks/use-budget";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { Edit2, Save, X, Plus, Trash2, PieChart, Target } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface BudgetLimitsSectionProps {
    month: string;
    year: number;
}

export function BudgetLimitsSection({ month, year }: BudgetLimitsSectionProps) {
    const { budget, monthlyStats, isLoading, refreshBudget } = useBudget(month, year);
    const [isEditing, setIsEditing] = useState(false);
    const [limits, setLimits] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set());
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);

    useEffect(() => {
        if (budget) {
            const budgetLimits = (budget.categoryLimits as Record<string, number>) || {};
            setLimits(budgetLimits);

            const initialVisible = new Set<string>();
            // All income/special categories that should NOT appear in budget limits
            const incomeCategories = ['Paycheck', 'Bonus', 'Savings', 'Debt Added', 'income', 'Transfer', 'Side Hustle', 'Freelance', 'Gifts Received', 'Refund'];

            // First, add categories from EXPENSE_CATEGORIES that have limits or spending
            EXPENSE_CATEGORIES.forEach(cat => {
                const limit = budgetLimits[cat.id] || 0;
                const spent = budget?.transactions
                    ?.filter(t => t.category === cat.id)
                    .reduce((sum, t) => sum + t.actual, 0) || 0;

                if (limit > 0 || spent > 0) {
                    initialVisible.add(cat.id);
                }
            });

            // Add categories that have explicit limits set
            Object.keys(budgetLimits).forEach(catId => {
                if (budgetLimits[catId] > 0) {
                    initialVisible.add(catId);
                }
            });

            // Auto-add ALL transaction categories that have spending (even if not in EXPENSE_CATEGORIES)
            // This ensures new transaction categories automatically appear with "unlimited" limit
            budget?.transactions?.forEach(t => {
                if (!incomeCategories.includes(t.category) && t.actual > 0) {
                    initialVisible.add(t.category);
                }
            });

            setVisibleCategories(initialVisible);
        }
    }, [budget]);

    const handleLimitChange = (category: string, value: string) => {
        const numValue = parseFloat(value);
        setLimits(prev => ({
            ...prev,
            [category]: isNaN(numValue) ? 0 : numValue
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/budget?month=${month}&year=${year}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryLimits: limits })
            });
            const result = await response.json();
            if (result.success) {
                await refreshBudget();
                setIsEditing(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (budget?.categoryLimits) {
            setLimits(budget.categoryLimits as Record<string, number>);
        }
        setIsEditing(false);
    };

    const handleAddCategory = (categoryId: string) => {
        setVisibleCategories(prev => new Set([...prev, categoryId]));
        if (!limits[categoryId]) {
            setLimits(prev => ({ ...prev, [categoryId]: 0 }));
        }
        setAddCategoryOpen(false);
    };

    const handleRemoveCategory = (categoryId: string) => {
        setVisibleCategories(prev => {
            const newSet = new Set(prev);
            newSet.delete(categoryId);
            return newSet;
        });
        setLimits(prev => ({ ...prev, [categoryId]: 0 }));
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl bg-zinc-900/50 border border-white/10 p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
        );
    }

    const hiddenCategories = EXPENSE_CATEGORIES.filter(cat => !visibleCategories.has(cat.id));

    // Build category data from ALL visible categories (including those not in EXPENSE_CATEGORIES)
    const categoryData = Array.from(visibleCategories).map(catId => {
        const expenseCat = EXPENSE_CATEGORIES.find(c => c.id === catId);
        const label = expenseCat?.label || catId; // Use category ID as label if not in predefined list

        const limit = limits[catId] || 0;
        const spent = budget?.transactions
            ?.filter(t => t.category === catId)
            .reduce((sum, t) => sum + t.actual, 0) || 0;

        // For categories with no limit (0), show as "Unlimited"
        const isUnlimited = limit === 0;
        const percent = limit > 0 ? Math.round((spent / limit) * 100) : (spent > 0 ? 100 : 0);
        const isOverBudget = !isUnlimited && percent > 100;
        const isFull = !isUnlimited && percent === 100; // Exactly at 100%

        return { id: catId, label, limit, spent, percent, isOverBudget, isFull, isUnlimited };
    }).sort((a, b) => a.label.localeCompare(b.label));

    return (
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 via-zinc-900/80 to-zinc-900/50 border border-violet-500/30 overflow-hidden shadow-lg shadow-violet-500/5">
            <div className="p-6 border-b border-violet-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-violet-500/10 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 shadow-inner">
                        <Target className="h-6 w-6 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-serif text-white">Monthly Budget Limits</h2>
                        <p className="text-sm text-violet-300/60">{month} {year}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            {hiddenCategories.length > 0 && (
                                <Popover open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-violet-500/50 text-violet-400 hover:bg-violet-500/20 hover:border-violet-400 rounded-xl">
                                            <Plus className="h-4 w-4 mr-1 text-violet-400" /> Add Category
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-72 max-h-96 overflow-y-auto p-3 bg-zinc-900 border border-white/10 shadow-2xl"
                                        align="end"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-primary uppercase tracking-wider px-2 py-1 mb-2">
                                                Select a category to add
                                            </p>
                                            <div className="space-y-0.5">
                                                {hiddenCategories.map(cat => {
                                                    const Icon = getCategoryIcon(cat.id);
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            onClick={() => handleAddCategory(cat.id)}
                                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 text-left group border border-transparent hover:border-primary/30"
                                                        >
                                                            <div className="bg-white/5 group-hover:bg-primary/20 p-1.5 rounded-md transition-colors">
                                                                <Icon className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
                                                            </div>
                                                            <span className="font-medium text-gray-300 group-hover:text-primary">{cat.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="rounded-xl">
                                <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-primary text-black hover:bg-primary/90 rounded-xl font-semibold">
                                <Save className="h-4 w-4 mr-1" /> {isSaving ? "Saving..." : "Save"}
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="border-zinc-700 hover:border-primary hover:bg-primary/10 rounded-xl">
                            <Edit2 className="h-4 w-4 mr-1" /> Edit Limits
                        </Button>
                    )}
                </div>
            </div>

            <div className="p-6">
                {/* Overall Summary */}
                {(() => {
                    // Only include categories that have a limit set for accurate percentage calculation
                    const categoriesWithLimits = categoryData.filter(cat => cat.limit > 0);
                    const totalLimit = categoriesWithLimits.reduce((sum, cat) => sum + cat.limit, 0);
                    const totalSpent = categoriesWithLimits.reduce((sum, cat) => sum + cat.spent, 0);

                    if (totalLimit === 0) return null;

                    const percent = Math.round((totalSpent / totalLimit) * 100);
                    const isOverBudget = percent > 100;

                    return (
                        <div className="mb-8 p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/20 shadow-inner">
                                    <PieChart className="h-5 w-5 text-emerald-400" />
                                </div>
                                <span className="text-sm font-medium text-emerald-300/80 uppercase tracking-wider">Overall Status</span>
                                <span className="text-xs text-gray-500">({categoriesWithLimits.length} categories with limits)</span>
                            </div>
                            <div className="flex justify-between items-end mb-4">
                                <span className={`text-4xl font-bold ${isOverBudget ? 'text-red-400' : 'text-white'}`}>{percent}%</span>
                                <div className="text-right">
                                    <span className={`text-lg font-semibold ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>${totalSpent.toLocaleString()}</span>
                                    <span className="text-gray-500"> / ${totalLimit.toLocaleString()}</span>
                                </div>
                            </div>
                            <Progress
                                value={percent > 100 ? 100 : percent}
                                indicatorClassName={isOverBudget ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-cyan-500"}
                                className="h-4 bg-white/10"
                            />
                        </div>
                    );
                })()}

                {categoryData.length === 0 && isEditing && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No categories selected. Click "Add Category" to add budget limits.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryData.map(cat => {
                        const Icon = getCategoryIcon(cat.id);
                        return (
                            <div
                                key={cat.id}
                                className={`p-4 rounded-xl border relative group transition-all hover:scale-[1.02] ${cat.isOverBudget
                                    ? 'bg-gradient-to-br from-red-500/15 via-red-500/10 to-transparent border-red-500/40 shadow-lg shadow-red-500/10'
                                    : cat.isFull
                                        ? 'bg-gradient-to-br from-yellow-500/15 via-yellow-500/10 to-transparent border-yellow-500/40 shadow-lg shadow-yellow-500/10'
                                        : cat.isUnlimited
                                            ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5'
                                            : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5'
                                    }`}
                            >
                                {isEditing && (
                                    <button
                                        onClick={() => handleRemoveCategory(cat.id)}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                                        title="Remove category"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${cat.isOverBudget
                                            ? 'bg-gradient-to-br from-red-500/30 to-red-500/20'
                                            : cat.isFull
                                                ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-500/20'
                                                : cat.isUnlimited
                                                    ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10'
                                                    : 'bg-gradient-to-br from-violet-500/20 to-purple-500/10'
                                            }`}>
                                            <Icon className={`w-5 h-5 ${cat.isOverBudget
                                                ? 'text-red-400'
                                                : cat.isFull
                                                    ? 'text-yellow-400'
                                                    : cat.isUnlimited
                                                        ? 'text-amber-400'
                                                        : 'text-violet-400'
                                                }`} />
                                        </div>
                                        <div>
                                            <Label className={`text-base font-semibold ${cat.isOverBudget
                                                ? 'text-red-400'
                                                : cat.isFull
                                                    ? 'text-yellow-400'
                                                    : 'text-white'
                                                }`}>
                                                {cat.label}
                                            </Label>
                                            <div className="text-xs mt-0.5 flex items-center gap-1.5">
                                                <span className="text-cyan-400">Spent: ${cat.spent.toFixed(0)}</span>
                                                <span className="text-gray-600">/</span>
                                                <span className={cat.isUnlimited ? 'text-amber-400' : 'text-emerald-400'}>
                                                    Limit: {cat.isUnlimited ? 'Unlimited' : `$${cat.limit.toFixed(0)}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={limits[cat.id] || ''}
                                            onChange={(e) => handleLimitChange(cat.id, e.target.value)}
                                            className="w-24 h-9 text-right bg-zinc-800 border-zinc-700 rounded-xl focus:border-violet-400"
                                            placeholder="0"
                                            min="0"
                                            onKeyDown={(e) => {
                                                if (['+', '-', 'e', 'E'].includes(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className={`text-sm font-bold px-2 py-1 rounded-lg ${cat.isOverBudget
                                            ? 'text-red-400 bg-red-500/20'
                                            : cat.isFull
                                                ? 'text-yellow-400 bg-yellow-500/20'
                                                : cat.isUnlimited
                                                    ? 'text-amber-400 bg-amber-500/20'
                                                    : 'text-violet-400 bg-violet-500/20'
                                            }`}>
                                            {cat.isUnlimited ? '∞' : `${cat.percent}%`}
                                        </div>
                                    )}
                                </div>

                                <Progress
                                    value={cat.isUnlimited ? 0 : Math.min(cat.percent, 100)}
                                    className="h-2 bg-white/10"
                                    indicatorClassName={
                                        cat.isOverBudget
                                            ? "bg-gradient-to-r from-red-500 to-orange-500"
                                            : cat.isFull
                                                ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                                                : cat.isUnlimited
                                                    ? "bg-gradient-to-r from-amber-500/50 to-yellow-500/50"
                                                    : "bg-gradient-to-r from-violet-500 to-cyan-500"
                                    }
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
