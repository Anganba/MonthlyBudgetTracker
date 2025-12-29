
import { useState, useEffect } from "react";
import { useGoals } from "@/hooks/use-goals";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Trash2, Trophy, ArrowRight, Target, Sparkles, CheckCircle2, Clock, CalendarDays, TrendingUp, Zap, Banknote } from "lucide-react";
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
    const { wallets } = useWallets();
    const { createTransaction } = useTransactions();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'progress' | 'target' | 'name' | 'deadline'>('progress');

    // Fulfillment State
    const [fulfillGoal, setFulfillGoal] = useState<Goal | null>(null);
    const [fulfillWalletId, setFulfillWalletId] = useState<string>('');

    // Quick Add State
    const [quickAddGoal, setQuickAddGoal] = useState<Goal | null>(null);
    const [quickAddAmount, setQuickAddAmount] = useState('');
    const [quickAddWalletId, setQuickAddWalletId] = useState<string>('');

    // Quick Pay Remaining State
    const [quickPayGoal, setQuickPayGoal] = useState<Goal | null>(null);
    const [quickPayWalletId, setQuickPayWalletId] = useState<string>('');

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
        // Default to first wallet
        if (wallets.length > 0) {
            setFulfillWalletId(wallets[0].id);
        }
    };

    const handleReactivate = (e: React.MouseEvent, goal: Goal) => {
        e.stopPropagation();
        updateGoal({ ...goal, status: 'active' });
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

            // Create a savings transaction
            await createTransaction({
                name: `Savings: ${quickAddGoal.name}`,
                category: 'Savings',
                type: 'expense',
                planned: amount,
                actual: amount,
                date: new Date().toISOString().split('T')[0],
                walletId: quickAddWalletId,
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
        if (quickPayGoal && quickPayWalletId) {
            const remainingAmount = quickPayGoal.targetAmount - quickPayGoal.currentAmount;

            if (remainingAmount <= 0) {
                setQuickPayGoal(null);
                return;
            }

            // Create a savings transaction for the remaining amount
            await createTransaction({
                name: `Savings: ${quickPayGoal.name} (Complete)`,
                category: 'Savings',
                type: 'expense',
                planned: remainingAmount,
                actual: remainingAmount,
                date: new Date().toISOString().split('T')[0],
                walletId: quickPayWalletId,
                goalId: quickPayGoal.id,
            });

            // Update goal to target amount (100% complete)
            updateGoal({ ...quickPayGoal, currentAmount: quickPayGoal.targetAmount });
            setQuickPayGoal(null);
            setQuickPayWalletId('');
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
                                                    <div className="flex items-center gap-1">
                                                        {/* Quick Add Button */}
                                                        {!isCompleted && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 md:h-8 md:w-8 text-violet-400 hover:text-violet-300 hover:bg-violet-500/20"
                                                                onClick={(e) => handleQuickAdd(e, goal)}
                                                                title="Quick Add"
                                                            >
                                                                <Zap className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                            </Button>
                                                        )}
                                                        {/* Quick Pay Remaining Button */}
                                                        {!isCompleted && goal.currentAmount < goal.targetAmount && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 md:h-8 md:w-8 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                                                onClick={(e) => handleQuickPay(e, goal)}
                                                                title={`Pay Remaining $${(goal.targetAmount - goal.currentAmount).toLocaleString()}`}
                                                            >
                                                                <Banknote className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                            </Button>
                                                        )}
                                                        {isCompleted && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 md:h-8 md:w-8 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                                                onClick={(e) => handleFulfillClick(e, goal)}
                                                                title="Move to Hall of Fame"
                                                            >
                                                                <Trophy className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 md:h-8 md:w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => handleDelete(e, goal.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
                                            className="group relative overflow-hidden rounded-2xl p-4 md:p-6 cursor-pointer bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 hover:border-yellow-500/50 transition-all hover:scale-[1.02]"
                                            onClick={() => handleEdit(goal)}
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <div className="p-2 md:p-2.5 rounded-xl bg-yellow-500/20">
                                                            <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-white text-sm md:text-lg">{goal.name}</h3>
                                                            {goal.completedAt && (
                                                                <p className="text-[10px] md:text-xs text-gray-500">
                                                                    Achieved {format(new Date(goal.completedAt), 'MMM d, yyyy')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 md:h-8 md:w-8 text-gray-500 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => handleReactivate(e, goal)}
                                                            title="Move back to Active"
                                                        >
                                                            <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 md:h-8 md:w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => handleDelete(e, goal.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                {goal.description && (
                                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{goal.description}</p>
                                                )}

                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xs md:text-sm font-medium text-yellow-400 flex items-center gap-1.5">
                                                        <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" /> GOAL ACHIEVED
                                                    </span>
                                                    <span className="text-lg md:text-2xl font-bold text-white">${goal.targetAmount.toLocaleString()}</span>
                                                </div>

                                                {/* Duration info */}
                                                {duration && (
                                                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 mb-3">
                                                        <CalendarDays className="h-3 w-3" />
                                                        <span>Completed in {duration}</span>
                                                    </div>
                                                )}

                                                <Progress value={100} className="h-2 bg-yellow-500/20" indicatorClassName="bg-yellow-500" />
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
                                        {wallets.map(w => {
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

                        {wallets.length > 0 && (
                            <div>
                                <Label className="text-gray-400">Pay from Wallet</Label>
                                <Select value={quickPayWalletId} onValueChange={setQuickPayWalletId}>
                                    <SelectTrigger className="mt-2 h-11 bg-zinc-800 border-zinc-700 rounded-xl">
                                        <SelectValue placeholder="Select wallet" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {wallets.map(w => {
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
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setQuickPayGoal(null)}>Cancel</Button>
                        <Button
                            onClick={confirmQuickPay}
                            disabled={
                                !quickPayWalletId ||
                                (() => {
                                    const selected = wallets.find(w => w.id === quickPayWalletId);
                                    const remaining = (quickPayGoal?.targetAmount || 0) - (quickPayGoal?.currentAmount || 0);
                                    return selected ? selected.balance < remaining : false;
                                })()
                            }
                            className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Pay & Complete Goal
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
                            This will create an expense transaction and deduct from your chosen wallet.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                            <p className="text-sm text-gray-400 mb-1">Purchase Amount</p>
                            <p className="text-3xl font-bold text-yellow-400">
                                ${fulfillGoal?.targetAmount.toLocaleString()}
                            </p>
                        </div>

                        {wallets.length > 0 && (
                            <div>
                                <Label className="text-gray-400">Spend from Wallet</Label>
                                <Select value={fulfillWalletId} onValueChange={setFulfillWalletId}>
                                    <SelectTrigger className="mt-2 h-11 bg-zinc-800 border-zinc-700 rounded-xl">
                                        <SelectValue placeholder="Select wallet" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {wallets.map(w => {
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
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setFulfillGoal(null); setFulfillWalletId(''); }}>Cancel</Button>
                        <Button
                            onClick={async () => {
                                if (fulfillGoal && fulfillWalletId) {
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
                                }
                                setFulfillGoal(null);
                                setFulfillWalletId('');
                            }}
                            disabled={!fulfillWalletId}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trophy className="h-4 w-4 mr-2" />
                            Record Purchase & Move to Hall of Fame
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
        </div>
    );
}
