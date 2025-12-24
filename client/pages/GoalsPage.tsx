
import { useState } from "react";
import { useGoals } from "@/hooks/use-goals";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Trash2, Trophy, ArrowRight, Target, Sparkles, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { GoalDialog } from "@/components/budget/GoalDialog";
import { Goal } from "@shared/api";
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
        if (wallets.length > 0) {
            const validWallets = wallets.filter(w => w.balance >= goal.currentAmount);
            const def = validWallets.find(w => w.type === 'cash') || validWallets[0] || wallets[0];
            setFulfillWalletId(def?.id || wallets[0]?.id);
        }
    };

    const confirmFulfill = async () => {
        if (!fulfillGoal) return;

        if (recordExpense && fulfillWalletId) {
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
    const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white p-8">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8 relative overflow-hidden">
            {/* Background decorations - hidden on mobile */}
            <div className="hidden md:block absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="hidden md:block absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-white">Savings Goals</h1>
                        <p className="text-gray-500 text-sm mt-0.5 md:mt-1 hidden sm:block">Track your progress towards financial milestones</p>
                    </div>
                    <Button
                        onClick={handleAdd}
                        className="bg-primary text-black hover:bg-primary/90 rounded-xl md:rounded-2xl px-4 md:px-6 h-10 md:h-11 font-bold shadow-lg shadow-primary/20 gap-1.5 md:gap-2 text-sm w-full sm:w-auto"
                    >
                        <Plus className="h-4 w-4" /> New Goal
                    </Button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-3 gap-2 md:gap-6">
                    <div className="rounded-xl md:rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 p-3 md:p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-primary/20">
                                <Target className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-gray-400">Active</p>
                                <p className="text-lg md:text-2xl font-bold text-white">{activeGoals.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl md:rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 p-3 md:p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-green-500/20">
                                <PiggyBank className="h-4 w-4 md:h-6 md:w-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-gray-400">Saved</p>
                                <p className="text-lg md:text-2xl font-bold text-white">${(totalSaved / 1000).toFixed(1)}k</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl md:rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 p-3 md:p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-yellow-500/20">
                                <Trophy className="h-4 w-4 md:h-6 md:w-6 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-gray-400">Achieved</p>
                                <p className="text-lg md:text-2xl font-bold text-white">{fulfilledGoals.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="bg-zinc-900/50 border border-white/10 p-1 rounded-xl md:rounded-2xl mb-4 md:mb-8">
                        <TabsTrigger
                            value="active"
                            className="rounded-lg md:rounded-xl px-3 md:px-6 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-black"
                        >
                            Active
                        </TabsTrigger>
                        <TabsTrigger
                            value="hof"
                            className="rounded-lg md:rounded-xl px-3 md:px-6 text-xs md:text-sm data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
                        >
                            🏆 <span className="hidden sm:inline">Hall of Fame</span><span className="sm:hidden">HoF</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="space-y-6">
                        {activeGoals.length === 0 ? (
                            <div className="text-center py-20 rounded-3xl bg-zinc-900/50 border border-dashed border-white/10">
                                <div className="p-4 rounded-2xl bg-primary/10 w-fit mx-auto mb-4">
                                    <PiggyBank className="h-12 w-12 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No active goals</h3>
                                <p className="text-gray-500 mb-6">Create a financial goal to start saving!</p>
                                <Button
                                    onClick={handleAdd}
                                    className="bg-primary text-black hover:bg-primary/90 rounded-2xl px-6 font-bold"
                                >
                                    Create Goal
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeGoals.map((goal) => {
                                    const progress = goal.targetAmount > 0
                                        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                                        : 0;
                                    const isCompleted = progress >= 100;

                                    return (
                                        <div
                                            key={goal.id}
                                            className={`group relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] ${isCompleted
                                                ? 'bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 hover:border-green-500/50'
                                                : 'bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 hover:border-primary/50'
                                                }`}
                                            onClick={() => handleEdit(goal)}
                                        >
                                            {/* Background glow */}
                                            {isCompleted && (
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
                                            )}

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl ${isCompleted ? 'bg-green-500/20' : 'bg-primary/20'}`}>
                                                            {isCompleted ? (
                                                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                                                            ) : (
                                                                <PiggyBank className="h-5 w-5 text-primary" />
                                                            )}
                                                        </div>
                                                        <h3 className="font-semibold text-white text-lg">{goal.name}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {isCompleted && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                                                onClick={(e) => handleFulfillClick(e, goal)}
                                                                title="Move to Hall of Fame"
                                                            >
                                                                <Trophy className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => handleDelete(e, goal.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-end mb-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Saved</p>
                                                        <p className="text-3xl font-bold text-white">${goal.currentAmount.toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Target</p>
                                                        <p className="text-lg font-medium text-gray-400">${goal.targetAmount.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Progress
                                                        value={progress}
                                                        className={`h-2 ${isCompleted ? 'bg-green-500/20' : 'bg-white/10'}`}
                                                        indicatorClassName={isCompleted ? 'bg-green-500' : 'bg-primary'}
                                                    />
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-xs font-medium ${isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
                                                            {isCompleted ? '✓ Goal Completed!' : `${Math.round(progress)}% saved`}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            ${(goal.targetAmount - goal.currentAmount).toLocaleString()} to go
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="hof" className="space-y-6">
                        {fulfilledGoals.length === 0 ? (
                            <div className="text-center py-20 rounded-3xl bg-zinc-900/50 border border-dashed border-yellow-500/20">
                                <div className="p-4 rounded-2xl bg-yellow-500/10 w-fit mx-auto mb-4">
                                    <Trophy className="h-12 w-12 text-yellow-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Hall of Fame is empty</h3>
                                <p className="text-gray-500">Complete your goals to see them here!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {fulfilledGoals.map((goal) => (
                                    <div
                                        key={goal.id}
                                        className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 hover:border-yellow-500/50 transition-all hover:scale-[1.02]"
                                        onClick={() => handleEdit(goal)}
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-yellow-500/20">
                                                        <Trophy className="h-5 w-5 text-yellow-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-white text-lg">{goal.name}</h3>
                                                        {goal.completedAt && (
                                                            <p className="text-xs text-gray-500">
                                                                Achieved {format(new Date(goal.completedAt), 'MMM d, yyyy')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => handleReactivate(e, goal)}
                                                        title="Move back to Active"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => handleDelete(e, goal.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-medium text-yellow-400 flex items-center gap-1.5">
                                                    <Sparkles className="h-3.5 w-3.5" /> GOAL ACHIEVED
                                                </span>
                                                <span className="text-2xl font-bold text-white">${goal.targetAmount.toLocaleString()}</span>
                                            </div>

                                            <Progress value={100} className="h-2 bg-yellow-500/20" indicatorClassName="bg-yellow-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <GoalDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleSubmit}
                initialData={editingGoal}
                mode={editingGoal ? 'edit' : 'add'}
            />

            {/* Fulfillment Dialog */}
            <AlertDialog open={!!fulfillGoal} onOpenChange={(open) => !open && setFulfillGoal(null)}>
                <AlertDialogContent className="bg-zinc-900 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-serif flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Goal Completed! 🎉
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Congratulations on reaching your goal <strong className="text-white">{fulfillGoal?.name}</strong>!
                            <br /><br />
                            Did you spend the saved <strong className="text-primary">${fulfillGoal?.currentAmount.toLocaleString()}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/5">
                            <input
                                type="checkbox"
                                id="record-expense"
                                checked={recordExpense}
                                onChange={(e) => setRecordExpense(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-600 bg-zinc-800 text-primary focus:ring-primary"
                            />
                            <label htmlFor="record-expense" className="text-sm font-medium text-gray-300">
                                Yes, record as an expense
                            </label>
                        </div>

                        {recordExpense && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Pay from Wallet</label>
                                <select
                                    className="flex h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                                        return <p className="text-xs text-red-400">Selected wallet has insufficient funds.</p>;
                                    }
                                    return null;
                                })()}
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-zinc-700 hover:bg-zinc-800">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmFulfill}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={recordExpense && wallets.find(w => w.id === fulfillWalletId)?.balance! < (fulfillGoal?.currentAmount || 0)}
                        >
                            Confirm Completion
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-zinc-900 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-serif">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            This will permanently delete this goal. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-zinc-700 hover:bg-zinc-800">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
