import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { EXPENSE_CATEGORIES } from "@/lib/categories";

interface BudgetLimitsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    month: string;
    year: number;
    initialLimits: Record<string, number>;
    onSuccess: () => void;
}

export function BudgetLimitsDialog({ open, onOpenChange, month, year, initialLimits, onSuccess }: BudgetLimitsDialogProps) {
    const [limits, setLimits] = useState<Record<string, number>>(initialLimits || {});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLimits(initialLimits || {});
        }
    }, [open, initialLimits]);

    const handleLimitChange = (category: string, value: string) => {
        const numValue = parseFloat(value);
        setLimits(prev => ({
            ...prev,
            [category]: isNaN(numValue) ? 0 : numValue
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`/api/budget?month=${month}&year=${year}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryLimits: limits })
            });
            const result = await response.json();
            if (result.success) {
                onSuccess();
                onOpenChange(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Merge default categories with any custom ones present in limits
    const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES.map(c => c.id), ...Object.keys(limits)]));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Set Monthly Budget Limits</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {allCategories.map(category => (
                        <div key={category} className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor={`limit-${category}`} className="text-right text-sm">
                                {category}
                            </Label>
                            <Input
                                id={`limit-${category}`}
                                type="number"
                                placeholder="0"
                                value={limits[category] || ''}
                                onChange={(e) => handleLimitChange(category, e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    ))}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Limits"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
