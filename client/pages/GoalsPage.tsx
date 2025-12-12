import { useState } from "react";
import { useGoals } from "@/hooks/use-goals";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { GoalDialog } from "@/components/budget/GoalDialog";
import { Goal } from "@shared/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function GoalsPage() {
    const { goals, isLoading, createGoal, updateGoal, deleteGoal } = useGoals();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleAdd = () => {
        setEditingGoal(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setIsDialogOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteGoal(deleteId);
            setDeleteId(null);
        }
    };

    const handleSubmit = (data: Partial<Goal>) => {
        if (editingGoal) {
            updateGoal({ ...data, id: editingGoal.id });
        } else {
            createGoal(data);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold font-serif">Goals</h1>
                <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Goal
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
            ) : goals.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                    <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No goals yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first financial goal to get started.</p>
                    <Button onClick={handleAdd}>Create Goal</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal) => {
                        const progress = goal.targetAmount > 0
                            ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                            : 0;

                        return (
                            <Card
                                key={goal.id}
                                className="group cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => handleEdit(goal)}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <PiggyBank className="h-5 w-5 text-primary" />
                                        </div>
                                        <CardTitle className="text-base font-semibold">{goal.name}</CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => handleDelete(e, goal.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Saved</p>
                                            <p className="text-2xl font-bold">${goal.currentAmount.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Target</p>
                                            <p className="text-base font-medium">${goal.targetAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Progress value={progress} className="h-2" />
                                        <p className="text-xs text-right text-muted-foreground">{Math.round(progress)}%</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <GoalDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleSubmit}
                initialData={editingGoal}
                mode={editingGoal ? 'edit' : 'add'}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this goal. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
