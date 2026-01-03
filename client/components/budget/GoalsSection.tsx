import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Target, Trophy, Sparkles, Clock, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useGoals } from "@/hooks/use-goals";
import { GoalDialog, getCategoryConfig } from "./GoalDialog";
import { Goal } from "@shared/api";
import { Link } from "react-router-dom";
import { differenceInDays } from "date-fns";

export function GoalsSection() {
    const { goals, isLoading, createGoal, updateGoal } = useGoals();
    const activeGoals = goals.filter(g => g.status === 'active' || !g.status);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    // Stats
    const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    const almostComplete = activeGoals.filter(g => {
        const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
        return progress >= 90 && progress < 100;
    }).length;

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

    const getDaysRemaining = (targetDate?: string) => {
        if (!targetDate) return null;
        const days = differenceInDays(new Date(targetDate), new Date());
        if (days < 0) return { text: 'Overdue', color: 'text-red-400' };
        if (days === 0) return { text: 'Due today', color: 'text-yellow-400' };
        if (days <= 7) return { text: `${days}d left`, color: 'text-yellow-400' };
        return { text: `${days}d left`, color: 'text-gray-500' };
    };

    return (
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 via-zinc-900/80 to-zinc-900/50 border border-violet-500/30 overflow-hidden shadow-lg shadow-violet-500/5 hover:shadow-violet-500/10 transition-shadow">
            <div className="p-3 md:p-4 border-b border-violet-500/20 flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-transparent">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 shadow-inner">
                        <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-violet-400" />
                    </div>
                    <h2 className="text-base md:text-lg font-bold font-serif text-white">Goals</h2>
                    {activeGoals.length > 0 && (
                        <span className="text-[10px] md:text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-md">
                            {overallProgress}% overall
                        </span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 md:h-8 md:w-8 text-violet-400 hover:text-violet-300 hover:bg-violet-500/20 rounded-lg md:rounded-xl transition-all"
                    onClick={handleAdd}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : activeGoals.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-3">
                            <PiggyBank className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm text-gray-400 mb-1">Start saving towards something</p>
                        <p className="text-xs text-gray-500 mb-3">Create your first savings goal</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAdd}
                            className="border-zinc-700 hover:border-primary hover:bg-primary/10"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Create Goal
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Almost Complete Banner */}
                        {almostComplete > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20 mb-2">
                                <Sparkles className="h-4 w-4 text-yellow-400" />
                                <span className="text-xs text-yellow-400 font-medium">
                                    {almostComplete} goal{almostComplete > 1 ? 's' : ''} almost complete! 🎯
                                </span>
                            </div>
                        )}

                        {activeGoals.slice(0, 4).map((goal) => {
                            const progress = goal.targetAmount > 0
                                ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                                : 0;
                            const isComplete = progress >= 100;
                            const isAlmostComplete = progress >= 90 && progress < 100;
                            const categoryConfig = getCategoryConfig(goal.category);
                            const CategoryIcon = categoryConfig.icon;
                            const daysInfo = getDaysRemaining(goal.targetDate);

                            return (
                                <Link to="/goals" key={goal.id}>
                                    <div
                                        className={`group p-2.5 md:p-3 rounded-xl transition-all border ${isComplete
                                            ? 'bg-gradient-to-r from-green-500/15 to-green-500/5 border-green-500/40 hover:border-green-500/60 shadow-lg shadow-green-500/10'
                                            : isAlmostComplete
                                                ? 'bg-gradient-to-r from-yellow-500/15 to-yellow-500/5 border-yellow-500/40 hover:border-yellow-500/60 shadow-lg shadow-yellow-500/10'
                                                : 'bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/20 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                            <div className={`p-1.5 md:p-2 rounded-lg ${isComplete ? 'bg-green-500/20' : isAlmostComplete ? 'bg-yellow-500/20' : categoryConfig.color.split(' ')[1] || 'bg-primary/20'}`}>
                                                {isComplete ? (
                                                    <Trophy className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-400" />
                                                ) : (
                                                    <CategoryIcon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isAlmostComplete ? 'text-yellow-400' : categoryConfig.color.split(' ')[0] || 'text-primary'}`} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h4 className="text-xs md:text-sm font-semibold text-white truncate">
                                                        {goal.name}
                                                    </h4>
                                                    <span className={`text-[10px] md:text-xs font-bold ${isComplete ? 'text-green-400' : isAlmostComplete ? 'text-yellow-400' : 'text-primary'}`}>
                                                        {Math.round(progress)}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-500">
                                                    <span>Target: ${goal.targetAmount.toLocaleString()}</span>
                                                    <div className="flex items-center gap-2">
                                                        {daysInfo && (
                                                            <span className={`flex items-center gap-0.5 ${daysInfo.color}`}>
                                                                <Clock className="h-2.5 w-2.5" />
                                                                {daysInfo.text}
                                                            </span>
                                                        )}
                                                        <span className="text-white font-medium">${goal.currentAmount.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Progress
                                            value={progress}
                                            className={`h-1 md:h-1.5 ${isComplete ? 'bg-green-500/20' : isAlmostComplete ? 'bg-yellow-500/20' : 'bg-white/10'}`}
                                            indicatorClassName={`${isComplete ? 'bg-green-500' : isAlmostComplete ? 'bg-yellow-500' : 'bg-primary'} transition-all duration-500`}
                                        />
                                    </div>
                                </Link>
                            );
                        })}

                        {/* View All Link */}
                        {activeGoals.length > 4 && (
                            <Link to="/goals" className="block">
                                <div className="flex items-center justify-center gap-1 p-2 text-xs text-gray-400 hover:text-primary transition-colors">
                                    <span>View all {activeGoals.length} goals</span>
                                    <ArrowRight className="h-3 w-3" />
                                </div>
                            </Link>
                        )}
                    </>
                )
                }
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
