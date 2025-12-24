import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useGoals } from "@/hooks/use-goals";
import { GoalDialog } from "./GoalDialog";
import { Goal } from "@shared/api";

export function GoalsSection() {
    const { goals, isLoading, createGoal, updateGoal } = useGoals();
    const activeGoals = goals.filter(g => g.status === 'active' || !g.status);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    const handleAdd = () => {
        setEditingGoal(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setIsDialogOpen(true);
    };

    const handleSubmit = (data: Partial<Goal>) => {
        if (editingGoal) {
            updateGoal({ ...data, id: editingGoal.id });
        } else {
            createGoal(data);
        }
    };

    return (
        <div className="rounded-2xl bg-zinc-900/50 border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/20">
                        <Target className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold font-serif text-white">Goals</h2>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-xl"
                    onClick={handleAdd}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <div className="p-4 space-y-3">
                {isLoading ? (
                    <p className="text-sm text-gray-500 text-center py-4">Loading goals...</p>
                ) : activeGoals.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-3">
                            <PiggyBank className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm text-gray-500 mb-3">No goals set yet.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAdd}
                            className="border-zinc-700 hover:border-primary hover:bg-primary/10"
                        >
                            Create Goal
                        </Button>
                    </div>
                ) : (
                    activeGoals.map((goal) => {
                        const progress = goal.targetAmount > 0
                            ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                            : 0;
                        const isComplete = progress >= 100;

                        return (
                            <div
                                key={goal.id}
                                className={`group cursor-pointer p-3 rounded-xl transition-all border ${isComplete
                                        ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                                        : 'bg-white/5 border-transparent hover:border-primary/30 hover:bg-white/10'
                                    }`}
                                onClick={() => handleEdit(goal)}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-500/20' : 'bg-primary/20'}`}>
                                        <PiggyBank className={`h-4 w-4 ${isComplete ? 'text-green-400' : 'text-primary'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className="text-sm font-semibold text-white truncate">
                                                {goal.name}
                                            </h4>
                                            <span className={`text-xs font-bold ${isComplete ? 'text-green-400' : 'text-primary'}`}>
                                                {Math.round(progress)}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>Target: ${goal.targetAmount.toLocaleString()}</span>
                                            <span className="text-white font-medium">${goal.currentAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <Progress
                                    value={progress}
                                    className={`h-1.5 ${isComplete ? 'bg-green-500/20' : 'bg-white/10'}`}
                                    indicatorClassName={isComplete ? 'bg-green-500' : 'bg-primary'}
                                />
                            </div>
                        );
                    })
                )}
            </div>

            <GoalDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleSubmit}
                initialData={editingGoal}
                mode={editingGoal ? 'edit' : 'add'}
            />
        </div>
    );
}
