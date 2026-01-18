
import { useState, useEffect } from "react";
import { useGoals } from "@/hooks/use-goals";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Trash2, Trophy, ArrowRight, Target, Sparkles, CheckCircle2, Clock, CalendarDays, TrendingUp, Zap, Banknote, Loader2, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { GoalDialog, getCategoryConfig, GOAL_CATEGORIES } from "@/components/budget/GoalDialog";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInDays, formatDistanceToNow } from "date-fns";

export default function GoalsPage() {
    const { goals, isLoading, createGoal, updateGoal, deleteGoal } = useGoals();
    const { wallets, isLoading: walletsLoading } = useWallets();
    const { createTransaction } = useTransactions();
    const queryClient = useQueryClient();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'progress' | 'target' | 'name' | 'deadline'>('progress');

    // Fulfillment State
    const [fulfillGoal, setFulfillGoal] = useState<Goal | null>(null);
    const [fulfillWalletId, setFulfillWalletId] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Quick Add State
    const [quickAddGoal, setQuickAddGoal] = useState<Goal | null>(null);
    const [quickAddAmount, setQuickAddAmount] = useState('');
    const [quickAddWalletId, setQuickAddWalletId] = useState<string>('');

    // Quick Pay Remaining State
    const [quickPayGoal, setQuickPayGoal] = useState<Goal | null>(null);
    const [quickPayWalletId, setQuickPayWalletId] = useState<string>('');

    // Reset Goal Progress State
    const [resetGoal, setResetGoal] = useState<Goal | null>(null);

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
        // Auto-select designated Savings Wallet for purchase
        const savingsWallet = wallets.find(w => w.isSavingsWallet);
        if (savingsWallet) {
            setFulfillWalletId(savingsWallet.id);
        } else if (wallets.length > 0) {
            setFulfillWalletId(wallets[0].id);
        }
    };

    const handleReactivate = async (e: React.MouseEvent, goal: Goal) => {
        e.stopPropagation();
        try {
            // First, revert the fulfillment (delete Bought: transaction and refund wallet)
            const response = await fetch('/api/goals/revert-fulfillment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goalId: goal.id }),
            });
            const result = await response.json();
            if (!result.success) {
                console.error('Failed to revert fulfillment:', result.message);
            }

            // Update goal status to active (don't pass currentAmount - let server keep recalculated value)
            await fetch(`/api/goals/${goal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'active',
                    completedAt: null
                }),
            });

            // Refresh all data
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            queryClient.invalidateQueries({ queryKey: ['budget'] });
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        } catch (error) {
            console.error('Error reactivating goal:', error);
        }
    };

    const handleQuickAdd = (e: React.MouseEvent, goal: Goal) => {
        e.stopPropagation();
        setQuickAddGoal(goal);
        setQuickAddAmount('');
        // Default to first wallet with sufficient balance or just first wallet
        if (wallets.length > 0) {
            setQuickAddWalletId(wallets[0].id);
        }
    };

    const confirmQuickAdd = async () => {
        if (quickAddGoal && quickAddAmount && quickAddWalletId) {
            const amount = parseFloat(quickAddAmount);
            const newAmount = quickAddGoal.currentAmount + amount;

            // Find designated Savings Wallet
            const savingsWallet = wallets.find(w => w.isSavingsWallet);

            if (!savingsWallet) {
                alert('Please designate a Savings Wallet first!\n\nGo to Wallets → Edit any wallet → Mark it as \"Savings Wallet\" to track your goal savings.');
                return;
            }

            // Create a savings transaction to Savings Wallet
            await createTransaction({
                name: `Savings: ${quickAddGoal.name}`,
                category: 'Savings',
                type: 'savings',
                planned: amount,
                actual: amount,
                date: new Date().toISOString().split('T')[0],
                walletId: quickAddWalletId,
                toWalletId: savingsWallet.id,
                goalId: quickAddGoal.id,
            });

            // Update goal amount
            updateGoal({ ...quickAddGoal, currentAmount: newAmount });
            setQuickAddGoal(null);
            setQuickAddAmount('');
            setQuickAddWalletId('');
        }
    };

    const handleQuickPay = (e: React.MouseEvent, goal: Goal) => {
        e.stopPropagation();
        setQuickPayGoal(goal);
        // Default to first wallet
        if (wallets.length > 0) {
            setQuickPayWalletId(wallets[0].id);
        }
    };

    const confirmQuickPay = async () => {
        if (quickPayGoal && quickPayWalletId && !isProcessing) {
            setIsProcessing(true);
            const remainingAmount = quickPayGoal.targetAmount - quickPayGoal.currentAmount;

            if (remainingAmount <= 0) {
                setQuickPayGoal(null);
                setIsProcessing(false);
                return;
            }

            try {
                // Find designated Savings Wallet
                const savingsWallet = wallets.find(w => w.isSavingsWallet);

                if (!savingsWallet) {
                    alert('Please designate a Savings Wallet first!\n\nGo to Wallets → Edit any wallet → Mark it as "Savings Wallet" to track your goal savings.');
                    setIsProcessing(false);
                    return;
                }

                // Create a savings transaction to Savings Wallet
                await createTransaction({
                    name: `Savings: ${quickPayGoal.name} (Complete)`,
                    category: 'Savings',
                    type: 'savings',
                    planned: remainingAmount,
                    actual: remainingAmount,
                    date: new Date().toISOString().split('T')[0],
                    walletId: quickPayWalletId,
                    toWalletId: savingsWallet.id,
                    goalId: quickPayGoal.id,
                });

                // Update goal to target amount (100% complete)
                updateGoal({ ...quickPayGoal, currentAmount: quickPayGoal.targetAmount });

                // Await fresh wallet and goals data before opening next dialog
                await queryClient.refetchQueries({ queryKey: ['wallets'] });
                await queryClient.refetchQueries({ queryKey: ['goals'] });

                // Close Quick Pay dialog
                setQuickPayGoal(null);
                setQuickPayWalletId('');

                // Open fulfillment dialog with Savings Wallet auto-selected
                setFulfillGoal(quickPayGoal);
                setFulfillWalletId(savingsWallet.id);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    // Reset goal progress - opens confirmation dialog
    const handleResetGoalProgress = (e: React.MouseEvent, goal: Goal) => {
        e.stopPropagation();
        setResetGoal(goal);
    };

    // Confirm reset goal progress
    const confirmResetGoalProgress = async () => {
        if (!resetGoal) return;

        setIsProcessing(true);
        try {
            const response = await fetch('/api/goals/reset-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goalId: resetGoal.id }),
            });
            const result = await response.json();

            if (result.success) {
                // Update goal amount to 0
                updateGoal({ ...resetGoal, currentAmount: 0 });

                // Refresh all data
                queryClient.invalidateQueries({ queryKey: ['wallets'] });
                queryClient.invalidateQueries({ queryKey: ['budget'] });
                queryClient.invalidateQueries({ queryKey: ['goals'] });
            } else {
                alert(result.message || 'Failed to reset goal progress');
            }
        } catch (error) {
            console.error('Error resetting goal:', error);
            alert('Failed to reset goal progress');
        } finally {
            setIsProcessing(false);
            setResetGoal(null);
        }
    };

    const activeGoals = goals.filter(g => g.status === 'active' || !g.status);
    const fulfilledGoals = goals.filter(g => g.status === 'fulfilled');
    const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    // Sort goals
    const sortedActiveGoals = [...activeGoals].sort((a, b) => {
        switch (sortBy) {
            case 'progress':
                const progA = a.targetAmount > 0 ? (a.currentAmount / a.targetAmount) : 0;
                const progB = b.targetAmount > 0 ? (b.currentAmount / b.targetAmount) : 0;
                return progB - progA;
            case 'target':
                return b.targetAmount - a.targetAmount;
            case 'name':
                return a.name.localeCompare(b.name);
            case 'deadline':
                if (!a.targetDate && !b.targetDate) return 0;
                if (!a.targetDate) return 1;
                if (!b.targetDate) return -1;
                return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
            default:
                return 0;
        }
    });

    // Format amount smartly
    const formatAmount = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
        return `$${amount.toLocaleString()}`;
    };

    // Get days remaining
    const getDaysRemaining = (targetDate?: string) => {
        if (!targetDate) return null;
        const days = differenceInDays(new Date(targetDate), new Date());
        if (days < 0) return { text: 'Overdue', color: 'text-red-400' };
        if (days === 0) return { text: 'Due today', color: 'text-yellow-400' };
        if (days <= 7) return { text: `${days}d left`, color: 'text-yellow-400' };
        if (days <= 30) return { text: `${days}d left`, color: 'text-orange-400' };
        return { text: `${days}d left`, color: 'text-gray-400' };
    };

    // Calculate savings rate needed (smart formatting based on timeframe)
    const getSavingsRateNeeded = (goal: Goal): string | null => {
        if (!goal.targetDate) return null;
        const remaining = goal.targetAmount - goal.currentAmount;
        if (remaining <= 0) return null;
        const days = differenceInDays(new Date(goal.targetDate), new Date());
        if (days <= 0) return null;

        // Choose the best unit based on timeframe
        if (days <= 7) {
            // Show per day for short timeframes
            const perDay = remaining / days;
            return `~$${Math.round(perDay).toLocaleString()}/day needed`;
        } else if (days <= 30) {
            // Show per week for medium timeframes
            const perWeek = remaining / (days / 7);
            return `~$${Math.round(perWeek).toLocaleString()}/wk needed`;
        } else {
            // Show per month for longer timeframes
            const perMonth = remaining / (days / 30);
            return `~$${Math.round(perMonth).toLocaleString()}/mo needed`;
        }
    };

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
            {/* Animated background decorations */}
            <div className="hidden md:block absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="hidden md:block absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/10 via-yellow-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
            <div className="hidden md:block absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-emerald-500/10 via-green-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="hidden md:block absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />

            <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-white">Savings Goals</h1>
                        <p className="text-gray-500 text-sm mt-0.5 md:mt-1 hidden sm:block">Track your progress towards financial milestones</p>
                    </div>
                    <Button
                        onClick={handleAdd}
                        className="bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400 rounded-xl md:rounded-2xl px-4 md:px-6 h-10 md:h-11 font-bold shadow-lg shadow-violet-500/30 gap-1.5 md:gap-2 text-sm w-full sm:w-auto transition-all hover:scale-[1.02]"
                    >
                        <Plus className="h-4 w-4" /> New Goal
                    </Button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
                    <div className="group rounded-xl md:rounded-2xl bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-purple-500/5 border border-violet-500/30 p-3 md:p-6 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 shadow-inner">
                                <Target className="h-4 w-4 md:h-6 md:w-6 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-violet-300/70">Active</p>
                                <p className="text-lg md:text-2xl font-bold text-white">{activeGoals.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-green-500/5 border border-emerald-500/30 p-3 md:p-6 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/20 shadow-inner">
                                <PiggyBank className="h-4 w-4 md:h-6 md:w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-emerald-300/70">Total Saved</p>
                                <p className="text-lg md:text-2xl font-bold text-emerald-400">{formatAmount(totalSaved)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-blue-500/5 border border-cyan-500/30 p-3 md:p-6 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 shadow-inner">
                                <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-cyan-300/70">Progress</p>
                                <p className="text-lg md:text-2xl font-bold text-cyan-400">{overallProgress}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-yellow-500/5 border border-amber-500/30 p-3 md:p-6 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/20 shadow-inner">
                                <Trophy className="h-4 w-4 md:h-6 md:w-6 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-amber-300/70">Achieved</p>
                                <p className="text-lg md:text-2xl font-bold text-amber-400">{fulfilledGoals.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="active" className="w-full">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
                        <TabsList className="bg-zinc-900/50 border border-white/10 p-1 rounded-xl md:rounded-2xl">
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

                        {/* Sort Dropdown */}
                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                            <SelectTrigger className="w-[140px] md:w-[180px] bg-zinc-900 border-white/10 rounded-xl h-9 md:h-10 text-xs md:text-sm">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10">
                                <SelectItem value="progress">Progress</SelectItem>
                                <SelectItem value="target">Target Amount</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="deadline">Deadline</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {sortedActiveGoals.map((goal) => {
                                    const progress = goal.targetAmount > 0
                                        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                                        : 0;
                                    const isCompleted = progress >= 100;
                                    const categoryConfig = getCategoryConfig(goal.category);
                                    const CategoryIcon = categoryConfig.icon;
                                    const daysInfo = getDaysRemaining(goal.targetDate);
                                    const savingsRate = getSavingsRateNeeded(goal);

                                    return (
                                        <div
                                            key={goal.id}
                                            className={`group relative overflow-hidden rounded-2xl p-4 md:p-6 cursor-pointer transition-all hover:scale-[1.02] shadow-lg ${isCompleted
                                                ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/40 hover:border-emerald-400/60 shadow-emerald-500/10'
                                                : 'bg-gradient-to-br from-violet-500/10 via-zinc-900/80 to-zinc-900/50 border border-violet-500/30 hover:border-violet-400/50 shadow-violet-500/5 hover:shadow-violet-500/10'
                                                }`}
                                            onClick={() => handleEdit(goal)}
                                        >
                                            {/* Background glow */}
                                            {isCompleted ? (
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
                                            ) : (
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <div className={`p-2 md:p-2.5 rounded-xl shadow-inner ${isCompleted ? 'bg-gradient-to-br from-emerald-500/30 to-green-500/20' : 'bg-gradient-to-br from-violet-500/30 to-purple-500/20'}`}>
                                                            {isCompleted ? (
                                                                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                                                            ) : (
                                                                <CategoryIcon className={`h-4 w-4 md:h-5 md:w-5 text-violet-400`} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-white text-sm md:text-lg truncate">{goal.name}</h3>
                                                            {daysInfo && (
                                                                <p className={`text-[10px] md:text-xs ${daysInfo.color} flex items-center gap-1`}>
                                                                    <Clock className="h-3 w-3" /> {daysInfo.text}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {/* Quick Add Button */}
                                                        {!isCompleted && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-violet-400 hover:text-violet-300 hover:bg-violet-500/20 rounded-xl transition-all"
                                                                onClick={(e) => handleQuickAdd(e, goal)}
                                                                title="Quick Add Savings"
                                                            >
                                                                <Zap className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {/* Quick Pay Remaining Button */}
                                                        {!isCompleted && goal.currentAmount < goal.targetAmount && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-xl transition-all"
                                                                onClick={(e) => handleQuickPay(e, goal)}
                                                                title={`Pay Remaining $${(goal.targetAmount - goal.currentAmount).toLocaleString()}`}
                                                            >
                                                                <Banknote className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {isCompleted && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-gray-400 hover:text-orange-400 hover:bg-orange-500/20 rounded-xl transition-all"
                                                                    onClick={(e) => handleResetGoalProgress(e, goal)}
                                                                    title="Reset progress - reverse all savings"
                                                                    disabled={isProcessing}
                                                                >
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 px-3 gap-1.5 text-yellow-500 hover:text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-xl transition-all font-medium text-xs border border-yellow-500/30 hover:border-yellow-500/50"
                                                                    onClick={(e) => handleFulfillClick(e, goal)}
                                                                    title="Move to Hall of Fame"
                                                                >
                                                                    <Trophy className="h-3.5 w-3.5" />
                                                                    <span className="hidden md:inline">Hall of Fame</span>
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/15 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                                                            onClick={(e) => handleDelete(e, goal.id)}
                                                            title="Delete Goal"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                {goal.description && (
                                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{goal.description}</p>
                                                )}

                                                <div className="flex justify-between items-end mb-3 md:mb-4">
                                                    <div>
                                                        <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Saved</p>
                                                        <p className="text-xl md:text-3xl font-bold text-white">${goal.currentAmount.toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Target</p>
                                                        <p className="text-base md:text-lg font-medium text-gray-400">${goal.targetAmount.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Progress
                                                        value={progress}
                                                        className={`h-2 ${isCompleted ? 'bg-emerald-500/20' : 'bg-white/10'}`}
                                                        indicatorClassName={isCompleted ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-violet-500 to-cyan-500'}
                                                    />
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-[10px] md:text-xs font-medium ${isCompleted ? 'text-emerald-400' : 'text-violet-300/70'}`}>
                                                            {isCompleted ? '✓ Goal Completed!' : `${Math.round(progress)}% saved`}
                                                        </span>
                                                        {!isCompleted && savingsRate && (
                                                            <span className="text-[10px] md:text-xs text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-md font-medium">
                                                                {savingsRate}
                                                            </span>
                                                        )}
                                                        {!isCompleted && !savingsRate && (
                                                            <span className="text-[10px] md:text-xs text-gray-500">
                                                                ${(goal.targetAmount - goal.currentAmount).toLocaleString()} to go
                                                            </span>
                                                        )}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {fulfilledGoals.map((goal) => {
                                    const categoryConfig = getCategoryConfig(goal.category);
                                    const CategoryIcon = categoryConfig.icon;

                                    // Calculate duration
                                    let duration = '';
                                    if (goal.startedAt && goal.completedAt) {
                                        const days = differenceInDays(new Date(goal.completedAt), new Date(goal.startedAt));
                                        if (days < 30) duration = `${days} days`;
                                        else if (days < 365) duration = `${Math.round(days / 30)} months`;
                                        else duration = `${(days / 365).toFixed(1)} years`;
                                    }

                                    return (
                                        <div
                                            key={goal.id}
                                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-2 border-yellow-500/50 hover:border-yellow-400/80 shadow-xl shadow-yellow-500/10 hover:shadow-yellow-500/20 transition-all hover:scale-[1.02]"
                                        >
                                            {/* Golden shimmer effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-amber-500/10 to-yellow-500/5 opacity-50" />
                                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-transparent rounded-full blur-3xl" />
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-500/15 to-transparent rounded-full blur-2xl" />

                                            {/* Trophy badge */}
                                            <div className="absolute -top-2 -right-2 p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl shadow-lg shadow-yellow-500/40 rotate-12">
                                                <Trophy className="h-5 w-5 text-white" />
                                            </div>

                                            <div className="relative z-10 p-5 md:p-6">
                                                {/* Header */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500/30 to-amber-500/20 border border-yellow-500/30 shadow-inner">
                                                            <CategoryIcon className="h-5 w-5 text-yellow-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-white text-lg">{goal.name}</h3>
                                                            {goal.completedAt && (
                                                                <p className="text-xs text-yellow-400/80 flex items-center gap-1 mt-0.5">
                                                                    <Sparkles className="h-3 w-3" />
                                                                    Achieved {format(new Date(goal.completedAt), 'MMM d, yyyy')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                {goal.description && (
                                                    <p className="text-xs text-gray-400 mb-4 line-clamp-2">{goal.description}</p>
                                                )}

                                                {/* Amount saved with golden styling */}
                                                <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Amount Saved</p>
                                                        <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                                                            ${goal.targetAmount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        {duration && (
                                                            <div className="text-xs text-gray-400">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Duration</p>
                                                                <p className="font-medium text-amber-300">{duration}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress bar with golden effect */}
                                                <Progress value={100} className="h-2.5 bg-yellow-500/20 mb-4" indicatorClassName="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400" />

                                                {/* Action buttons */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/30">
                                                        🏆 Goal Completed
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-3 gap-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all text-xs opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => handleReactivate(e, goal)}
                                                        title="Move back to Active (reverses purchase)"
                                                    >
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                        Reactivate
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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

            {/* Quick Add Dialog */}
            <Dialog open={!!quickAddGoal} onOpenChange={(open) => !open && setQuickAddGoal(null)}>
                <DialogContent className="sm:max-w-sm bg-zinc-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Quick Add
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Add savings to <strong className="text-white">{quickAddGoal?.name}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label className="text-gray-400">Amount to add</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={quickAddAmount}
                                onChange={(e) => setQuickAddAmount(e.target.value)}
                                placeholder="0.00"
                                autoFocus
                                className="mt-2 h-12 bg-zinc-800 border-zinc-700 rounded-xl text-lg"
                            />
                        </div>

                        {wallets.length > 0 && (
                            <div>
                                <Label className="text-gray-400">Take from Wallet</Label>
                                <Select value={quickAddWalletId} onValueChange={setQuickAddWalletId}>
                                    <SelectTrigger className="mt-2 h-11 bg-zinc-800 border-zinc-700 rounded-xl">
                                        <SelectValue placeholder="Select wallet" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {wallets.filter(w => !w.isSavingsWallet).map(w => {
                                            const hasEnough = w.balance >= (parseFloat(quickAddAmount) || 0);
                                            return (
                                                <SelectItem key={w.id} value={w.id}>
                                                    {w.name} (${w.balance.toLocaleString()})
                                                    {!hasEnough && quickAddAmount && ' ⚠️'}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                {(() => {
                                    const selected = wallets.find(w => w.id === quickAddWalletId);
                                    const amount = parseFloat(quickAddAmount) || 0;
                                    if (selected && amount > 0 && selected.balance < amount) {
                                        return <p className="text-xs text-yellow-400 mt-1">⚠️ Insufficient balance in this wallet</p>;
                                    }
                                    return null;
                                })()}
                            </div>
                        )}

                        <p className="text-xs text-gray-500 pt-2 border-t border-white/5">
                            Goal: ${quickAddGoal?.currentAmount.toLocaleString()} → ${((quickAddGoal?.currentAmount || 0) + (parseFloat(quickAddAmount) || 0)).toLocaleString()}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setQuickAddGoal(null)}>Cancel</Button>
                        <Button
                            onClick={confirmQuickAdd}
                            disabled={
                                !quickAddAmount ||
                                parseFloat(quickAddAmount) <= 0 ||
                                !quickAddWalletId ||
                                (() => {
                                    const selected = wallets.find(w => w.id === quickAddWalletId);
                                    return selected ? selected.balance < parseFloat(quickAddAmount || '0') : false;
                                })()
                            }
                            className="bg-primary text-black hover:bg-primary/90 font-bold rounded-xl"
                        >
                            Add ${quickAddAmount || '0'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quick Pay Remaining Dialog */}
            <Dialog open={!!quickPayGoal} onOpenChange={(open) => !open && setQuickPayGoal(null)}>
                <DialogContent className="sm:max-w-sm bg-zinc-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-green-400" />
                            Pay Remaining
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Complete <strong className="text-white">{quickPayGoal?.name}</strong> by paying the remaining amount
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                            <p className="text-sm text-gray-400 mb-1">Amount to pay</p>
                            <p className="text-3xl font-bold text-green-400">
                                ${((quickPayGoal?.targetAmount || 0) - (quickPayGoal?.currentAmount || 0)).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                This will complete your goal 100%
                            </p>
                        </div>

                        {walletsLoading ? (
                            <div className="flex items-center justify-center py-6 gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="text-gray-400 text-sm">Loading wallets...</span>
                            </div>
                        ) : wallets.length > 0 ? (
                            <div>
                                <Label className="text-gray-400">Pay from Wallet</Label>
                                <Select value={quickPayWalletId} onValueChange={setQuickPayWalletId}>
                                    <SelectTrigger className="mt-2 h-11 bg-zinc-800 border-zinc-700 rounded-xl">
                                        <SelectValue placeholder="Select wallet" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {wallets.filter(w => !w.isSavingsWallet).map(w => {
                                            const remaining = (quickPayGoal?.targetAmount || 0) - (quickPayGoal?.currentAmount || 0);
                                            const hasEnough = w.balance >= remaining;
                                            return (
                                                <SelectItem key={w.id} value={w.id}>
                                                    {w.name} (${w.balance.toLocaleString()})
                                                    {!hasEnough && ' ⚠️'}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                {(() => {
                                    const selected = wallets.find(w => w.id === quickPayWalletId);
                                    const remaining = (quickPayGoal?.targetAmount || 0) - (quickPayGoal?.currentAmount || 0);
                                    if (selected && remaining > 0 && selected.balance < remaining) {
                                        return <p className="text-xs text-yellow-400 mt-1">⚠️ Insufficient balance in this wallet</p>;
                                    }
                                    return null;
                                })()}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">No wallets available</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setQuickPayGoal(null)}>Cancel</Button>
                        <Button
                            onClick={confirmQuickPay}
                            disabled={
                                walletsLoading ||
                                !quickPayWalletId ||
                                isProcessing ||
                                (() => {
                                    const selected = wallets.find(w => w.id === quickPayWalletId);
                                    const remaining = (quickPayGoal?.targetAmount || 0) - (quickPayGoal?.currentAmount || 0);
                                    return selected ? selected.balance < remaining : false;
                                })()
                            }
                            className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing...' : 'Pay & Complete Goal'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Fulfillment Dialog */}
            <Dialog open={!!fulfillGoal} onOpenChange={(open) => !open && setFulfillGoal(null)}>
                <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Goal Completed! 🎉
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Congratulations on reaching your goal <strong className="text-white">{fulfillGoal?.name}</strong>!
                            <br /><br />
                            You're about to record the purchase of this item for <strong className="text-primary">${fulfillGoal?.targetAmount.toLocaleString()}</strong>.
                            <br /><br />
                            This will create an expense transaction and deduct from your <strong className="text-primary">Savings Wallet</strong> (where your goal savings have been accumulating).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                            <p className="text-sm text-gray-400 mb-1">Purchase Amount</p>
                            <p className="text-3xl font-bold text-yellow-400">
                                ${fulfillGoal?.targetAmount.toLocaleString()}
                            </p>
                        </div>

                        {walletsLoading ? (
                            <div className="flex items-center justify-center py-6 gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="text-gray-400 text-sm">Loading wallets...</span>
                            </div>
                        ) : wallets.length > 0 ? (
                            <div>
                                <Label className="text-gray-400">Spend from Wallet</Label>
                                <Select value={fulfillWalletId} onValueChange={setFulfillWalletId}>
                                    <SelectTrigger className="mt-2 h-11 bg-zinc-800 border-zinc-700 rounded-xl">
                                        <SelectValue placeholder="Select wallet" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {wallets.filter(w => w.isSavingsWallet).map(w => {
                                            const hasEnough = w.balance >= (fulfillGoal?.targetAmount || 0);
                                            return (
                                                <SelectItem key={w.id} value={w.id}>
                                                    {w.name} (${w.balance.toLocaleString()})
                                                    {!hasEnough && ' ⚠️'}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                {(() => {
                                    const selected = wallets.find(w => w.id === fulfillWalletId);
                                    const amount = fulfillGoal?.targetAmount || 0;
                                    if (selected && amount > 0 && selected.balance < amount) {
                                        return <p className="text-xs text-yellow-400 mt-1">⚠️ Insufficient balance in this wallet</p>;
                                    }
                                    return null;
                                })()}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">No wallets available</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setFulfillGoal(null); setFulfillWalletId(''); }}>Cancel</Button>
                        <Button
                            onClick={async () => {
                                if (fulfillGoal && fulfillWalletId && !isProcessing) {
                                    setIsProcessing(true);
                                    try {
                                        const categoryConfig = getCategoryConfig(fulfillGoal.category);

                                        // Create expense transaction
                                        await createTransaction({
                                            name: `Bought: ${fulfillGoal.name}`,
                                            category: categoryConfig.label,
                                            type: 'expense',
                                            planned: fulfillGoal.targetAmount,
                                            actual: fulfillGoal.targetAmount,
                                            date: new Date().toISOString().split('T')[0],
                                            walletId: fulfillWalletId,
                                            goalId: fulfillGoal.id,
                                        });

                                        // Mark goal as fulfilled
                                        updateGoal({
                                            ...fulfillGoal,
                                            status: 'fulfilled',
                                            completedAt: new Date().toISOString()
                                        });

                                        setFulfillGoal(null);
                                        setFulfillWalletId('');
                                    } finally {
                                        setIsProcessing(false);
                                    }
                                }
                            }}
                            disabled={!fulfillWalletId || isProcessing}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trophy className="h-4 w-4 mr-2" />
                            {isProcessing ? 'Processing...' : 'Record Purchase & Move to Hall of Fame'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

            {/* Reset Goal Confirmation Dialog */}
            <AlertDialog open={!!resetGoal} onOpenChange={(open) => !open && setResetGoal(null)}>
                <AlertDialogContent className="bg-zinc-900 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-serif flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-orange-400" />
                            Reset Goal Progress?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            This will reverse all savings transactions linked to <strong className="text-white">"{resetGoal?.name}"</strong> and reset progress to $0.
                            <br /><br />
                            The money will be refunded to the original source wallets.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-zinc-700 hover:bg-zinc-800">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmResetGoalProgress}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Resetting...' : 'Reset Progress'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
