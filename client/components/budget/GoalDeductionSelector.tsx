import React, { useState, useEffect, useMemo } from 'react';
import { Goal } from '@shared/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, AlertTriangle, Target } from 'lucide-react';

export interface GoalDeduction {
    goalId: string;
    amount: number;
}

interface GoalDeductionSelectorProps {
    goals: Goal[];
    totalAmount: number;
    onDeductionsChange: (deductions: GoalDeduction[]) => void;
    currency?: string;
}

export function GoalDeductionSelector({
    goals,
    totalAmount,
    onDeductionsChange,
    currency = '$'
}: GoalDeductionSelectorProps) {
    const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
    const [manualAmounts, setManualAmounts] = useState<Record<string, number>>({});

    // Filter to only active goals with savings
    const activeGoals = useMemo(() =>
        goals.filter(g => g.status === 'active' && g.currentAmount > 0),
        [goals]
    );

    // Smart suggestion algorithm
    const suggestedDeductions = useMemo(() => {
        if (totalAmount <= 0 || activeGoals.length === 0) return [];

        // Sort by currentAmount descending (largest first)
        const sorted = [...activeGoals].sort((a, b) => b.currentAmount - a.currentAmount);

        // Try to find single goal that can cover it
        const singleGoal = sorted.find(g => g.currentAmount >= totalAmount);
        if (singleGoal) {
            return [{ goalId: singleGoal.id, amount: totalAmount }];
        }

        // Greedily select largest goals until covered
        const selected: GoalDeduction[] = [];
        let remaining = totalAmount;

        for (const goal of sorted) {
            if (remaining <= 0) break;
            const deduct = Math.min(goal.currentAmount, remaining);
            if (deduct > 0) {
                selected.push({ goalId: goal.id, amount: deduct });
                remaining -= deduct;
            }
        }

        return selected;
    }, [activeGoals, totalAmount]);

    // Apply smart selection
    const handleSmartSelect = () => {
        const newSelected = new Set<string>();
        const newAmounts: Record<string, number> = {};

        suggestedDeductions.forEach(d => {
            newSelected.add(d.goalId);
            newAmounts[d.goalId] = d.amount;
        });

        setSelectedGoals(newSelected);
        setManualAmounts(newAmounts);
    };

    // Toggle goal selection
    const handleToggleGoal = (goalId: string, checked: boolean) => {
        const newSelected = new Set(selectedGoals);
        if (checked) {
            newSelected.add(goalId);
        } else {
            newSelected.delete(goalId);
        }
        setSelectedGoals(newSelected);
    };

    // Update manual amount for a goal
    const handleAmountChange = (goalId: string, amount: number) => {
        setManualAmounts(prev => ({
            ...prev,
            [goalId]: Math.max(0, amount)
        }));
    };

    // Calculate deductions and notify parent
    useEffect(() => {
        const deductions: GoalDeduction[] = [];

        selectedGoals.forEach(goalId => {
            const goal = activeGoals.find(g => g.id === goalId);
            if (!goal) return;

            const amount = manualAmounts[goalId] ?? 0;
            const clampedAmount = Math.min(amount, goal.currentAmount);

            if (clampedAmount > 0) {
                deductions.push({ goalId, amount: clampedAmount });
            }
        });

        onDeductionsChange(deductions);
    }, [selectedGoals, manualAmounts, activeGoals, onDeductionsChange]);

    // Auto-distribute remaining amount when goals are selected
    useEffect(() => {
        if (selectedGoals.size === 0) return;

        // If no manual amounts set yet, auto-distribute
        const hasManualAmounts = Array.from(selectedGoals).some(id => manualAmounts[id] !== undefined);
        if (hasManualAmounts) return;

        // Distribute evenly or by capacity
        const selectedGoalsList = activeGoals.filter(g => selectedGoals.has(g.id));
        const totalCapacity = selectedGoalsList.reduce((sum, g) => sum + g.currentAmount, 0);

        if (totalCapacity <= 0) return;

        let remaining = totalAmount;
        const newAmounts: Record<string, number> = {};

        // Sort by current amount desc and distribute
        const sorted = [...selectedGoalsList].sort((a, b) => b.currentAmount - a.currentAmount);
        for (const goal of sorted) {
            const deduct = Math.min(goal.currentAmount, remaining);
            newAmounts[goal.id] = deduct;
            remaining -= deduct;
        }

        setManualAmounts(prev => ({ ...prev, ...newAmounts }));
    }, [selectedGoals, activeGoals, totalAmount]);

    const totalDeduction = useMemo(() => {
        return Array.from(selectedGoals).reduce((sum, goalId) => {
            return sum + (manualAmounts[goalId] || 0);
        }, 0);
    }, [selectedGoals, manualAmounts]);

    const isSuggested = (goalId: string) => {
        return suggestedDeductions.some(d => d.goalId === goalId);
    };

    if (activeGoals.length === 0) {
        return (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">No active goals with savings to deduct from.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">This will reduce your goal savings!</span>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleSmartSelect}
                    className="h-7 text-xs border-amber-500/50 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Smart Select
                </Button>
            </div>

            <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Select goals to deduct from:</Label>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {activeGoals.map(goal => {
                        const isSelected = selectedGoals.has(goal.id);
                        const suggested = isSuggested(goal.id);
                        const progress = goal.targetAmount > 0
                            ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                            : 0;
                        const deductAmount = manualAmounts[goal.id] || 0;
                        const afterDeduct = Math.max(0, goal.currentAmount - deductAmount);

                        return (
                            <div
                                key={goal.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isSelected
                                        ? 'bg-amber-500/20 border-amber-500/50'
                                        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                                    }`}
                            >
                                <Checkbox
                                    id={`goal-${goal.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => handleToggleGoal(goal.id, !!checked)}
                                    className="border-zinc-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-3 w-3 text-gray-500" />
                                        <span className="text-sm font-medium text-white truncate">{goal.name}</span>
                                        {suggested && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300">
                                                Suggested
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                        <span>{currency}{goal.currentAmount.toLocaleString()}</span>
                                        <span>/</span>
                                        <span>{currency}{goal.targetAmount.toLocaleString()}</span>
                                        <span className="text-gray-600">•</span>
                                        <span>{progress}%</span>
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">-{currency}</span>
                                        <Input
                                            type="number"
                                            value={deductAmount || ''}
                                            onChange={(e) => handleAmountChange(goal.id, parseFloat(e.target.value) || 0)}
                                            className="w-20 h-7 text-xs bg-zinc-800 border-zinc-600 text-amber-400"
                                            max={goal.currentAmount}
                                            min={0}
                                        />
                                        {deductAmount > 0 && (
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                → {currency}{afterDeduct.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
                <span className="text-sm text-gray-400">Total deduction:</span>
                <span className={`text-sm font-bold ${totalDeduction === totalAmount
                        ? 'text-green-400'
                        : totalDeduction < totalAmount
                            ? 'text-amber-400'
                            : 'text-red-400'
                    }`}>
                    -{currency}{totalDeduction.toLocaleString()}
                    {totalDeduction !== totalAmount && (
                        <span className="text-gray-500 font-normal ml-1">
                            / {currency}{totalAmount.toLocaleString()}
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
}
