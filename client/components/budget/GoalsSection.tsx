import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Edit2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useGoals } from "@/hooks/use-goals";
import { GoalDialog } from "./GoalDialog";
import { Goal } from "@shared/api";

export function GoalsSection() {
    const { goals, isLoading, createGoal, updateGoal } = useGoals();
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
        <Card className="bg-card border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold font-serif text-white">Goals</CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-white"
                    onClick={handleAdd}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading goals...</p>
                ) : goals.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-2">No goals set yet.</p>
                        <Button variant="outline" size="sm" onClick={handleAdd}>Create Goal</Button>
                    </div>
                ) : (
                    goals.map((goal) => {
                        const progress = goal.targetAmount > 0
                            ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                            : 0;

                        return (
                            <div
                                key={goal.id}
                                className="group cursor-pointer hover:bg-white/5 p-3 rounded-lg transition border border-transparent hover:border-white/10"
                                onClick={() => handleEdit(goal)}
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className={`w-10 h-10 rounded-full bg-[#bef264]/10 flex items-center justify-center border border-[#bef264]/20`}>
                                        <PiggyBank className="h-5 w-5 text-[#bef264]" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-bold text-white">
                                                {goal.name}
                                            </h4>
                                            <span className="text-xs font-bold text-[#bef264]">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Target: ${goal.targetAmount.toLocaleString()}</span>
                                            <span className="text-white font-medium">${goal.currentAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <Progress value={progress} className="h-1.5 bg-secondary [&>div]:bg-[#bef264]" />
                            </div>
                        );
                    })
                )}
            </CardContent>

            <GoalDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleSubmit}
                initialData={editingGoal}
                mode={editingGoal ? 'edit' : 'add'}
            />
        </Card>
    );
}
