import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useBudget } from "@/hooks/use-budget";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { Edit2, Save, X } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";

interface BudgetLimitsSectionProps {
    month: string;
    year: number;
}

export function BudgetLimitsSection({ month, year }: BudgetLimitsSectionProps) {
    const { budget, monthlyStats, isLoading, refreshBudget } = useBudget(month, year);
    const [isEditing, setIsEditing] = useState(false);
    const [limits, setLimits] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initialize limits from budget data
    useEffect(() => {
        if (budget?.categoryLimits) {
            setLimits(budget.categoryLimits as Record<string, number>);
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

    if (isLoading) {
        return <div>Loading limits...</div>;
    }

    // Prepare data for rendering
    const categoryData = EXPENSE_CATEGORIES.map(cat => {
        const limit = limits[cat.id] || 0;
        // Find actual spend from local calculation or monthlyStats if available.
        // Since we need live updates, let's rely on passed transactions if possible or use what we have.
        // Use useBudget's monthlyStats if it has category breakdown, otherwise assume 0 for now or calculate.
        // Looking at BudgetStatus logic, it calculates from transactions.
        // Let's emulate that:
        const spent = budget?.transactions
            ?.filter(t => t.category === cat.id)
            .reduce((sum, t) => sum + t.actual, 0) || 0;

        const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        const isOverBudget = percent > 100;

        return {
            ...cat,
            limit,
            spent,
            percent,
            isOverBudget
        };
    }).sort((a, b) => {
        // Sort by name for stable order during editing
        return a.label.localeCompare(b.label);
    });

    return (
        <Card className="items-center bg-card border-none shadow-xl mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold font-serif text-white">Monthly Budget Limits ({month} {year})</CardTitle>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                                <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                <Save className="h-4 w-4 mr-1" /> {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-4 w-4 mr-1" /> Edit Limits
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryData.map(cat => {
                        const Icon = getCategoryIcon(cat.id);
                        return (
                            <div key={cat.id} className="space-y-3 p-4 bg-secondary/10 rounded-lg border border-white/5">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-secondary p-2 rounded-lg text-white shrink-0">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <Label className="text-base font-semibold">{cat.label}</Label>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Spent: ${cat.spent.toFixed(0)} / Limit: ${cat.limit.toFixed(0)}
                                            </div>
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={limits[cat.id] || ''}
                                            onChange={(e) => handleLimitChange(cat.id, e.target.value)}
                                            className="w-24 h-8 text-right"
                                            placeholder="0"
                                        />
                                    ) : (
                                        <div className={`text-sm font-bold ${cat.isOverBudget ? 'text-red-500' : 'text-primary'}`}>
                                            {cat.percent}%
                                        </div>
                                    )}
                                </div>

                                <Progress
                                    value={Math.min(cat.percent, 100)}
                                    className="h-2"
                                    indicatorClassName={cat.isOverBudget ? "bg-red-500" : "bg-primary"}
                                />
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
