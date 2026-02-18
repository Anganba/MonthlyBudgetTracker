import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { useBudget } from "@/hooks/use-budget";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { Edit2, Save, X, Plus, Trash2, PieChart, Target, Check } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import { useCategories, CustomCategory } from "@/hooks/use-categories";
import { ICON_PICKER_OPTIONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface BudgetLimitsSectionProps {
    month: string;
    year: number;
}

export function BudgetLimitsSection({ month, year }: BudgetLimitsSectionProps) {
    const { budget, monthlyStats, isLoading, refreshBudget } = useBudget(month, year);
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [limits, setLimits] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set());
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const { customCategories, addCategory, removeCategory: deleteCustomCategory } = useCategories();

    // Inline new category creation state
    const [isCreatingBudgetCat, setIsCreatingBudgetCat] = useState(false);
    const [budgetCatName, setBudgetCatName] = useState('');
    const [budgetCatIcon, setBudgetCatIcon] = useState('CircleDollarSign');
    const [removeConfirm, setRemoveConfirm] = useState<{ id: string; label: string; spent: number; limit: number; isUnlimited: boolean } | null>(null);

    const { data: usedCategories = [] } = useQuery<string[]>({
        queryKey: ['used-categories'],
        queryFn: async () => {
            const res = await fetch('/api/budget/used-categories');
            if (!res.ok) return [];
            const json = await res.json();
            return json.data || [];
        },
        staleTime: 60 * 1000,
    });

    // Merge static expense categories with custom categories
    const allAvailableCategories = useMemo(() => {
        // Include custom expense categories
        const customExpenseCats = customCategories
            .filter(c => c.type === 'expense')
            .map(c => ({ id: c.id, label: c.label, type: 'expense' }));

        return [...EXPENSE_CATEGORIES, ...customExpenseCats].sort((a, b) => a.label.localeCompare(b.label));
    }, [customCategories]);

    useEffect(() => {
        if (budget) {
            const budgetLimits = (budget.categoryLimits as Record<string, number>) || {};
            setLimits(budgetLimits);

            const initialVisible = new Set<string>();
            // All income/special categories that should NOT appear in budget limits
            const incomeCategories = ['Paycheck', 'Bonus', 'Savings', 'Debt Added', 'income', 'Income', 'Transfer', 'Side Hustle', 'Freelance', 'Gifts Received', 'Refund', 'Loan Repaid'];

            // Build a set of valid category IDs from ONLY static + current custom categories
            // (not from allAvailableCategories, which re-adds deleted custom cats via transaction usage)
            const validCategoryIds = new Set([
                ...EXPENSE_CATEGORIES.map(c => c.id),
                ...customCategories.filter(c => c.type === 'expense').map(c => c.id)
            ]);

            // 1. Add all categories that have active limits (only if still valid)
            Object.keys(budgetLimits).forEach(catId => {
                if (budgetLimits[catId] >= 0 && validCategoryIds.has(catId)) {
                    initialVisible.add(catId);
                }
            });

            // 2. Add all categories present in transactions (excluding income, only if still valid)
            const transactionCategories = new Set<string>(budget?.transactions?.map(t => t.category) || []);
            transactionCategories.forEach((cat: string) => {
                if (!incomeCategories.includes(cat) && validCategoryIds.has(cat)) {
                    initialVisible.add(cat);
                }
            });

            setVisibleCategories(initialVisible);
        }
    }, [budget, customCategories]);

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
        setIsCreatingBudgetCat(false);
    };

    const handleCreateAndAddCategory = () => {
        if (!budgetCatName.trim()) return;
        const catId = budgetCatName.trim();
        const newCat: CustomCategory = {
            id: catId,
            label: catId,
            type: 'expense',
            icon: budgetCatIcon,
        };
        const success = addCategory(newCat);
        if (success) {
            // Also add it to visible categories and set a default limit
            setVisibleCategories(prev => new Set([...prev, catId]));
            setLimits(prev => ({ ...prev, [catId]: 0 }));
            setBudgetCatName('');
            setBudgetCatIcon('CircleDollarSign');
            setIsCreatingBudgetCat(false);
            setAddCategoryOpen(false);
            toast({
                title: "Custom Category Created",
                description: `Category "${catId}" has been created and added to your budget limits.`,
            });
        }
    };

    const handleRemoveCategory = (categoryId: string) => {
        // If it's a custom category, delete it permanently
        const isCustom = customCategories.some(c => c.id === categoryId);
        if (isCustom) {
            deleteCustomCategory(categoryId);
            toast({
                title: "Category Deleted",
                description: `Category "${categoryId}" has been permanently deleted.`,
            });
        }

        setVisibleCategories(prev => {
            const newSet = new Set(prev);
            newSet.delete(categoryId);
            return newSet;
        });

        // Remove the limit entirely (don't just set to 0, as 0 means Unlimited now)
        setLimits(prev => {
            const newLimits = { ...prev };
            delete newLimits[categoryId];
            return newLimits;
        });
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl bg-zinc-900/50 border border-white/10 p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
        );
    }





    const hiddenCategories = allAvailableCategories.filter(cat => !visibleCategories.has(cat.id));

    // Build category data from ALL visible categories
    const categoryData = Array.from(visibleCategories).map(catId => {
        const catDef = allAvailableCategories.find(c => c.id === catId);
        const label = catDef?.label || catId;

        const limit = limits[catId] || 0;
        const spent = budget?.transactions
            ?.filter(t => t.category === catId)
            .reduce((sum, t) => sum + t.actual, 0) || 0;

        // For categories with no limit (0), show as "Unlimited"
        const isUnlimited = limit === 0;
        const percent = limit > 0 ? Math.round((spent / limit) * 100) : (spent > 0 ? 100 : 0);
        const isOverBudget = !isUnlimited && spent > limit;
        const isFull = !isUnlimited && percent === 100 && !isOverBudget; // Exactly at 100% and not over

        return { id: catId, label, limit, spent, percent, isOverBudget, isFull, isUnlimited };
    }).sort((a, b) => a.label.localeCompare(b.label));

    return (
        <>
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
                                {
                                    <Popover open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="border-violet-500/50 text-violet-400 hover:bg-violet-500/20 hover:border-violet-400 rounded-xl">
                                                <Plus className="h-4 w-4 mr-1 text-violet-400" /> Add Category
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-80 max-h-[420px] overflow-y-auto p-3 bg-zinc-900 border border-white/10 shadow-2xl"
                                            align="end"
                                        >
                                            {!isCreatingBudgetCat ? (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-primary uppercase tracking-wider px-2 py-1 mb-2">
                                                        Select a category to add
                                                    </p>
                                                    {/* Create New Category Button */}
                                                    <button
                                                        onClick={() => setIsCreatingBudgetCat(true)}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-emerald-500/10 transition-all text-left group border border-transparent hover:border-emerald-500/30 mb-1"
                                                    >
                                                        <div className="bg-emerald-500/20 p-1.5 rounded-md">
                                                            <Plus className="h-4 w-4 text-emerald-400" />
                                                        </div>
                                                        <span className="font-semibold text-emerald-400">New Custom Category</span>
                                                    </button>
                                                    {hiddenCategories.length > 0 && <div className="border-t border-white/10 my-1" />}
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
                                            ) : (
                                                /* Inline New Category Creation */
                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider px-1">
                                                        Create New Category
                                                    </p>
                                                    <Input
                                                        value={budgetCatName}
                                                        onChange={(e) => setBudgetCatName(e.target.value)}
                                                        placeholder="Category name"
                                                        autoFocus
                                                        className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-9 text-sm"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') { e.preventDefault(); handleCreateAndAddCategory(); }
                                                            if (e.key === 'Escape') setIsCreatingBudgetCat(false);
                                                        }}
                                                    />
                                                    {/* Icon Picker */}
                                                    <div>
                                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Icon</span>
                                                        <div className="grid grid-cols-8 gap-1 mt-1 max-h-[100px] overflow-y-auto pr-1">
                                                            {ICON_PICKER_OPTIONS.map(({ name, icon: IconComp }) => (
                                                                <button
                                                                    key={name}
                                                                    type="button"
                                                                    onClick={() => setBudgetCatIcon(name)}
                                                                    className={cn(
                                                                        "p-1.5 rounded-lg transition-all",
                                                                        budgetCatIcon === name
                                                                            ? "bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 scale-110"
                                                                            : "bg-white/5 border border-transparent text-gray-500 hover:text-white hover:bg-white/10"
                                                                    )}
                                                                >
                                                                    <IconComp className="h-3.5 w-3.5" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {/* Actions */}
                                                    <div className="flex gap-1.5">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => { setIsCreatingBudgetCat(false); setBudgetCatName(''); setBudgetCatIcon('CircleDollarSign'); }}
                                                            className="flex-1 h-7 text-xs text-gray-400 hover:text-white"
                                                        >
                                                            Back
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={handleCreateAndAddCategory}
                                                            disabled={!budgetCatName.trim()}
                                                            className="flex-1 h-7 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 disabled:opacity-50"
                                                        >
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Create & Add
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </PopoverContent>
                                    </Popover>
                                }
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
                        const isOverBudget = totalSpent > totalLimit;

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
                                            onClick={() => setRemoveConfirm({ id: cat.id, label: cat.label, spent: cat.spent, limit: cat.limit, isUnlimited: cat.isUnlimited })}
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

            {/* Remove Category Confirmation Dialog */}
            <AlertDialog open={!!removeConfirm} onOpenChange={(open) => !open && setRemoveConfirm(null)}>
                <AlertDialogContent className="bg-zinc-900 border-red-500/30">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-red-500/20">
                                <Trash2 className="h-5 w-5 text-red-400" />
                            </div>
                            Remove Category
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to remove{' '}
                            <span className="font-semibold text-white">"{removeConfirm?.label}"</span>{' '}
                            from your budget limits?
                            <br /><br />
                            <span className="text-gray-300">
                                Current limit: <span className="text-white font-medium">{removeConfirm?.isUnlimited ? 'Unlimited' : `$${removeConfirm?.limit?.toLocaleString()}`}</span>
                                {' '} • Spent: <span className="text-white font-medium">${removeConfirm?.spent?.toLocaleString()}</span>
                            </span>
                            {customCategories.some(c => c.id === removeConfirm?.id) && (
                                <>
                                    <br /><br />
                                    <span className="text-amber-400">⚠️ This is a custom category — it will be permanently deleted.</span>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-gray-300 hover:bg-zinc-700 hover:text-white">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => {
                                if (removeConfirm) {
                                    handleRemoveCategory(removeConfirm.id);
                                    setRemoveConfirm(null);
                                }
                            }}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
