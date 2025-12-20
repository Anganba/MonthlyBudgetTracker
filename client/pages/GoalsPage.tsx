
import { useState } from "react";
import { useGoals } from "@/hooks/use-goals";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Trash2, Trophy, ArrowRight } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function GoalsPage() {
    const { goals, isLoading, createGoal, updateGoal, deleteGoal } = useGoals();
    const { wallets } = useWallets();
    const { createTransaction } = useTransactions();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Fulfillment State
    const [fulfillGoal, setFulfillGoal] = useState<Goal | null>(null);
    const [fulfillWalletId, setFulfillWalletId] = useState<string>('');
    const [recordExpense, setRecordExpense] = useState(true);

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

    const handleFulfillClick = (e: React.MouseEvent, goal: Goal) => {
        e.stopPropagation();
        setFulfillGoal(goal);
        // Default to first valid wallet, or cash, or first available
        if (wallets.length > 0) {
            const validWallets = wallets.filter(w => w.balance >= goal.currentAmount);
            const def = validWallets.find(w => w.type === 'cash') || validWallets[0] || wallets[0];
            setFulfillWalletId(def?.id || wallets[0]?.id);
        }
    };

    const confirmFulfill = async () => {
        if (!fulfillGoal) return;

        if (recordExpense && fulfillWalletId) {
            // Create Expense Transaction
            createTransaction({
                name: `Goal Reached: ${fulfillGoal.name}`,
                category: 'Shopping',
                type: 'expense',
                planned: fulfillGoal.currentAmount,
                actual: fulfillGoal.currentAmount,
                date: new Date().toISOString(),
                walletId: fulfillWalletId,
                goalId: fulfillGoal.id
            });
        }

        updateGoal({ ...fulfillGoal, status: 'fulfilled' });
        setFulfillGoal(null);
    };

    const handleReactivate = (e: React.MouseEvent, goal: Goal) => {
        e.stopPropagation();
        updateGoal({ ...goal, status: 'active' });
    }

    const activeGoals = goals.filter(g => g.status === 'active' || !g.status);
    const fulfilledGoals = goals.filter(g => g.status === 'fulfilled');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground p-8">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-serif">Goals</h1>
                <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Goal
                </Button>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
                    <TabsTrigger value="active">Active Goals</TabsTrigger>
                    <TabsTrigger value="hof">Hall of Fame 🏆</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-6">
                    {activeGoals.length === 0 ? (
                        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                            <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground">No active goals</h3>
                            <p className="text-muted-foreground mb-4">Create a financial goal to get started.</p>
                            <Button onClick={handleAdd}>Create Goal</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeGoals.map((goal) => {
                                const progress = goal.targetAmount > 0
                                    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                                    : 0;
                                const isCompleted = progress >= 100;

                                return (
                                    <Card
                                        key={goal.id}
                                        className={`group cursor-pointer hover:border-primary/50 transition-colors ${isCompleted ? 'border-green-500/50 bg-green-500/5' : ''}`}
                                        onClick={() => handleEdit(goal)}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-green-500/20' : 'bg-primary/10'}`}>
                                                    <PiggyBank className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-primary'}`} />
                                                </div>
                                                <CardTitle className="text-base font-semibold">{goal.name}</CardTitle>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {isCompleted && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                                        onClick={(e) => handleFulfillClick(e, goal)}
                                                        title="Move to Hall of Fame"
                                                    >
                                                        <Trophy className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => handleDelete(e, goal.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
                                                <Progress value={progress} className={`h-2 ${isCompleted ? 'bg-green-500/20' : ''}`} indicatorClassName={isCompleted ? 'bg-green-500' : ''} />
                                                <p className={`text-xs text-right ${isCompleted ? 'text-green-500 font-bold' : 'text-muted-foreground'}`}>
                                                    {Math.round(progress)}%
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="hof" className="space-y-6">
                    {fulfilledGoals.length === 0 ? (
                        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
                            <Trophy className="h-12 w-12 text-yellow-500/50 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground">Hall of Fame is empty</h3>
                            <p className="text-muted-foreground mb-4">Complete your goals to see them here!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {fulfilledGoals.map((goal) => (
                                <Card
                                    key={goal.id}
                                    className="group cursor-pointer border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/40 transition-colors"
                                    onClick={() => handleEdit(goal)}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                                <Trophy className="h-5 w-5 text-yellow-500" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold">{goal.name}</CardTitle>
                                                {goal.completedAt && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Achieved {format(new Date(goal.completedAt), 'MMM d, yyyy')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleReactivate(e, goal)}
                                                title="Move back to Active"
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleDelete(e, goal.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-yellow-500/80">GOAL ACHIEVED</span>
                                            <span className="text-xl font-bold text-foreground">${goal.targetAmount.toLocaleString()}</span>
                                        </div>
                                        <Progress value={100} className="h-2 bg-yellow-500/20" indicatorClassName="bg-yellow-500" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <GoalDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleSubmit}
                initialData={editingGoal}
                mode={editingGoal ? 'edit' : 'add'}
            />

            {/* Fulfillment Dialog */}
            <AlertDialog open={!!fulfillGoal} onOpenChange={(open) => !open && setFulfillGoal(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Goal Completed! 🎉</AlertDialogTitle>
                        <AlertDialogDescription>
                            Congratulations on reaching your goal <strong>{fulfillGoal?.name}</strong>!
                            <br /><br />
                            Did you spend the saved <strong>${fulfillGoal?.currentAmount.toLocaleString()}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="record-expense"
                                checked={recordExpense}
                                onChange={(e) => setRecordExpense(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="record-expense" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Yes, record as an expense
                            </label>
                        </div>

                        {recordExpense && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Pay from Wallet</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={fulfillWalletId}
                                    onChange={(e) => setFulfillWalletId(e.target.value)}
                                >
                                    {wallets.map(w => {
                                        const disabled = w.balance < (fulfillGoal?.currentAmount || 0);
                                        return (
                                            <option key={w.id} value={w.id} disabled={disabled}>
                                                {w.name} (${w.balance}) {disabled ? '(Insufficient Funds)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                {(() => {
                                    const selectedWallet = wallets.find(w => w.id === fulfillWalletId);
                                    if (selectedWallet && selectedWallet.balance < (fulfillGoal?.currentAmount || 0)) {
                                        return <p className="text-xs text-red-500">Selected wallet has insufficient funds.</p>;
                                    }
                                    return null;
                                })()}
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmFulfill}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={recordExpense && wallets.find(w => w.id === fulfillWalletId)?.balance! < (fulfillGoal?.currentAmount || 0)}
                        >
                            Confirm Completion
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
