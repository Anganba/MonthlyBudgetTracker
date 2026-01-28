import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RecurringTransaction } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Repeat, Calendar, DollarSign, Clock, Pencil, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWallets } from "@/hooks/use-wallets";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BudgetLimitsSection } from "@/components/budget/BudgetLimitsSection";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function RecurringPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { wallets } = useWallets();
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<RecurringTransaction | null>(null);
    const [date] = useState(new Date());
    const MONTHS = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // State for selected month/year
    const [month, setMonth] = useState(MONTHS[date.getMonth()]);
    const [year, setYear] = useState(date.getFullYear());

    const handleMonthChange = (newMonth: string, newYear: number) => {
        setMonth(newMonth);
        setYear(newYear);
    };

    const handlePrevMonth = () => {
        const currentMonthIndex = MONTHS.indexOf(month);
        if (currentMonthIndex === 0) {
            handleMonthChange(MONTHS[11], year - 1);
        } else {
            handleMonthChange(MONTHS[currentMonthIndex - 1], year);
        }
    };

    const handleNextMonth = () => {
        const currentMonthIndex = MONTHS.indexOf(month);
        if (currentMonthIndex === 11) {
            handleMonthChange(MONTHS[0], year + 1);
        } else {
            handleMonthChange(MONTHS[currentMonthIndex + 1], year);
        }
    };

    const { data: recurringList, isLoading } = useQuery({
        queryKey: ['recurring', user?.id],
        queryFn: async () => {
            const res = await fetch("/api/recurring");
            const json = await res.json();
            return json.data as RecurringTransaction[];
        },
        enabled: !!user,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`/api/recurring/${id}`, { method: "DELETE" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/recurring", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
            setIsAddOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...data }: any) => {
            const res = await fetch(`/api/recurring/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
            setEditingItem(null);
        }
    });

    const handleEdit = (item: RecurringTransaction) => {
        setEditingItem(item);
    };

    // Stats - Gross totals for all frequencies
    const totalGrossExpenses = recurringList?.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0) || 0;
    const totalGrossIncome = recurringList?.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0) || 0;
    const totalRules = recurringList?.length || 0;

    // Format next run date nicely
    const formatNextRun = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'MMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    if (isLoading) return <LoadingScreen size="lg" />;

    return (
        <div className="min-h-screen bg-background text-white p-4 md:p-6 lg:p-8 relative overflow-hidden">
            {/* Animated background decorations */}
            <div className="hidden md:block absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="hidden md:block absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
            <div className="hidden md:block absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-emerald-500/10 via-green-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="hidden md:block absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-gradient-to-br from-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />

            <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-white">Recurring & Budget</h1>
                        <p className="text-gray-500 text-sm mt-0.5 md:mt-1 hidden sm:block">Manage automatic transactions and monthly limits</p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        {/* Month Selector */}
                        <div className="flex items-center bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-1.5 flex-1 sm:flex-none justify-between sm:justify-start">
                            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 hover:bg-primary hover:text-black transition-all rounded-xl">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold text-white min-w-[150px] text-center flex items-center justify-center gap-2 px-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                {month} {year}
                            </span>
                            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 hover:bg-primary hover:text-black transition-all rounded-xl">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            onClick={() => setIsAddOpen(true)}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 rounded-xl md:rounded-2xl px-4 md:px-6 h-11 font-bold shadow-lg shadow-cyan-500/30 gap-1.5 md:gap-2 text-sm hidden sm:flex transition-all hover:scale-[1.02]"
                        >
                            <Plus className="h-4 w-4" /> Add Recurring
                        </Button>
                    </div>
                </div>

                {/* Mobile Add Button */}
                <Button
                    onClick={() => setIsAddOpen(true)}
                    className="sm:hidden w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 rounded-xl h-11 font-bold shadow-lg shadow-cyan-500/30 gap-2 text-sm"
                >
                    <Plus className="h-4 w-4" /> Add Recurring Rule
                </Button>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
                    <div className="group rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-blue-500/5 border border-cyan-500/30 p-3 md:p-6 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 shadow-inner">
                                <Repeat className="h-4 w-4 md:h-6 md:w-6 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-cyan-300/70">Active Rules</p>
                                <p className="text-lg md:text-2xl font-bold text-white">{totalRules}</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-green-500/5 border border-emerald-500/30 p-3 md:p-6 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/20 shadow-inner">
                                <ArrowUpCircle className="h-4 w-4 md:h-6 md:w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-emerald-300/70">Gross Income</p>
                                <p className="text-lg md:text-2xl font-bold text-emerald-400">${totalGrossIncome.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-xl md:rounded-2xl bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-pink-500/5 border border-rose-500/30 p-3 md:p-6 shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-rose-500/30 to-pink-500/20 shadow-inner">
                                <ArrowDownCircle className="h-4 w-4 md:h-6 md:w-6 text-rose-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-rose-300/70">Gross Expense</p>
                                <p className="text-lg md:text-2xl font-bold text-rose-400">${totalGrossExpenses.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-xl md:rounded-2xl bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-purple-500/5 border border-violet-500/30 p-3 md:p-6 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 shadow-inner">
                                <Calendar className="h-4 w-4 md:h-6 md:w-6 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-violet-300/70">Current Period</p>
                                <p className="text-lg md:text-2xl font-bold text-white">{month}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recurring Rules */}
                <div className="rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500/10 via-zinc-900/80 to-zinc-900/50 border border-cyan-500/30 overflow-hidden shadow-lg shadow-cyan-500/5">
                    <div className="p-4 md:p-6 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-transparent">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 shadow-inner">
                                <Repeat className="h-4 w-4 md:h-5 md:w-5 text-cyan-400" />
                            </div>
                            <h2 className="text-base md:text-xl font-bold text-white font-serif">Active Rules</h2>
                        </div>
                    </div>

                    {recurringList?.length === 0 ? (
                        <div className="p-8 md:p-12 text-center">
                            <div className="p-4 rounded-2xl bg-white/5 w-fit mx-auto mb-4">
                                <Repeat className="h-10 w-10 md:h-12 md:w-12 text-gray-500" />
                            </div>
                            <h3 className="text-base md:text-lg font-medium text-white mb-2">No recurring transactions</h3>
                            <p className="text-gray-500 mb-6 text-sm">Set up automatic transactions to save time</p>
                            <Button
                                onClick={() => setIsAddOpen(true)}
                                className="bg-primary text-black hover:bg-primary/90 rounded-xl md:rounded-2xl px-6 font-bold"
                            >
                                Create Your First Rule
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {recurringList?.map((item) => {
                                const isIncome = item.type === 'income';
                                const wallet = wallets.find(w => w.id === item.walletId);
                                return (
                                    <div
                                        key={item.id}
                                        className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${isIncome ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                                                {isIncome ? (
                                                    <ArrowUpCircle className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
                                                ) : (
                                                    <ArrowDownCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white text-sm md:text-lg">{item.name}</h3>
                                                <div className="flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1 flex-wrap">
                                                    <span className="text-xs md:text-sm text-gray-400">{item.category}</span>
                                                    <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full capitalize ${isIncome ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                                        {isIncome ? 'Income' : 'Expense'}
                                                    </span>
                                                    <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{item.frequency}</span>
                                                    {wallet && (
                                                        <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 flex items-center gap-1">
                                                            <DollarSign className="h-2.5 w-2.5" />
                                                            {wallet.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 md:gap-6 justify-between md:justify-end">
                                            <div className="text-left md:text-right">
                                                <p className={`text-lg md:text-2xl font-bold ${isIncome ? 'text-green-400' : 'text-white'}`}>
                                                    {isIncome ? '+' : ''}${item.amount.toFixed(2)}
                                                </p>
                                                <p className="text-[10px] md:text-xs text-gray-500">Next: {formatNextRun(item.nextRunDate)}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/20 rounded-lg md:rounded-xl"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg md:rounded-xl"
                                                    onClick={() => setDeleteConfirm(item)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Budget Limits Section */}
                <div className="mt-4 md:mt-8">
                    <BudgetLimitsSection month={month} year={year} />
                </div>
            </div>

            <RecurringDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onSubmit={(data) => createMutation.mutate(data)}
                mode="add"
                isSubmitting={createMutation.isPending}
            />

            <RecurringDialog
                open={!!editingItem}
                onOpenChange={(open) => !open && setEditingItem(null)}
                onSubmit={(data) => updateMutation.mutate({ id: editingItem?.id, ...data })}
                initialData={editingItem}
                mode="edit"
                isSubmitting={updateMutation.isPending}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent className="bg-zinc-900 border-red-500/30">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-red-500/20">
                                <Trash2 className="h-5 w-5 text-red-400" />
                            </div>
                            Delete Recurring Rule
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to delete the recurring rule{' '}
                            <span className="font-semibold text-white">"{deleteConfirm?.name}"</span>?
                            <br /><br />
                            This will stop all future automatic {deleteConfirm?.type === 'income' ? 'income' : 'expense'} transactions
                            ({deleteConfirm?.frequency}) of <span className="text-white font-medium">${deleteConfirm?.amount.toLocaleString()}</span>.
                            <br /><br />
                            <span className="text-amber-400">⚠️ Past transactions created by this rule will not be affected.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-gray-300 hover:bg-zinc-700 hover:text-white">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => {
                                if (deleteConfirm) {
                                    deleteMutation.mutate(deleteConfirm.id);
                                    setDeleteConfirm(null);
                                }
                            }}
                        >
                            Delete Rule
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

interface RecurringDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => void;
    initialData?: RecurringTransaction | null;
    mode: 'add' | 'edit';
    isSubmitting?: boolean;
}

function RecurringDialog({ open, onOpenChange, onSubmit, initialData, mode, isSubmitting }: RecurringDialogProps) {
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Rent");
    const [frequency, setFrequency] = useState("monthly");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState<string>("");
    const [walletId, setWalletId] = useState<string>("");
    const { wallets } = useWallets();

    useEffect(() => {
        if (open && initialData) {
            setType(initialData.type || 'expense');
            setName(initialData.name);
            setAmount(initialData.amount.toString());
            setCategory(initialData.category);
            setFrequency(initialData.frequency);
            setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
            setTime(initialData.time || "");
            setWalletId(initialData.walletId || "");
        } else if (open && mode === 'add') {
            // Reset form for new entries
            setType('expense');
            setName("");
            setAmount("");
            setCategory("Rent");
            setFrequency("monthly");
            setStartDate(new Date().toISOString().split('T')[0]);
            setTime("");
            setWalletId("");
        }
    }, [open, initialData, mode]);

    // Update category when type changes (only if current category doesn't match new type)
    useEffect(() => {
        const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        const currentCategoryExists = categories.some(c => c.id === category);

        // Only reset category if it doesn't exist in the new type's categories
        if (!currentCategoryExists) {
            if (type === 'income') {
                setCategory(INCOME_CATEGORIES[0]?.id || 'Paycheck');
            } else {
                setCategory(EXPENSE_CATEGORIES[0]?.id || 'Rent');
            }
        }
    }, [type, category]);

    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate amount is greater than 0
        const amountValue = parseFloat(amount) || 0;
        if (amountValue <= 0) {
            toast({
                title: "Amount Required",
                description: "Please enter an amount greater than $0.",
                variant: "destructive",
            });
            return;
        }

        // Check for no changes in edit mode
        if (mode === 'edit' && initialData) {
            const noChanges =
                name === initialData.name &&
                amountValue === initialData.amount &&
                type === (initialData.type || 'expense') &&
                category === initialData.category &&
                frequency === initialData.frequency &&
                startDate === (initialData.startDate || '') &&
                (time || '') === (initialData.time || '') &&
                (walletId || '') === (initialData.walletId || '');

            if (noChanges) {
                toast({
                    title: "No Changes",
                    description: "No changes were made to this recurring rule.",
                });
                setTimeout(() => onOpenChange(false), 100);
                return;
            }
        }

        onSubmit({
            name,
            amount: parseFloat(amount),
            type,
            category,
            frequency,
            startDate,
            time: time || undefined,
            walletId: walletId || undefined
        });
    };

    const { data: usedCategories = [] } = useQuery<string[]>({
        queryKey: ['used-categories'],
        queryFn: async () => {
            const res = await fetch('/api/budget/used-categories');
            if (!res.ok) return [];
            const json = await res.json();
            return json.data || [];
        },
        staleTime: 60 * 1000, // 1 minute
    });

    // Merge static and dynamic categories
    const categories = useMemo(() => {
        const staticList = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        const staticIds = new Set(staticList.map(c => c.id));

        // Find which custom categories are likely relevant
        // Since we don't know the type of custom categories from the simple string list,
        // we'll explicitly exclude ones that are known to be OF THE OTHER TYPE
        const otherTypeStaticIds = new Set(
            (type === 'income' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => c.id)
        );

        const customOptions = usedCategories
            .filter(cat => !staticIds.has(cat)) // Not in current list
            .filter(cat => !otherTypeStaticIds.has(cat)) // Not KNOWN to be the other type
            .map(cat => ({ id: cat, label: cat, type: type })); // Create temporary def

        // Combine and sort
        return [...staticList, ...customOptions].sort((a, b) => a.label.localeCompare(b.label));
    }, [type, usedCategories]);

    // Type-based color schemes
    const typeColors = {
        expense: {
            gradient: 'from-red-500/20 via-rose-500/10 to-transparent',
            border: 'border-red-500/30',
            accent: 'text-red-400',
            bg: 'bg-red-500/10',
        },
        income: {
            gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
            border: 'border-emerald-500/30',
            accent: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
        },
    };

    const colors = typeColors[type];
    const title = mode === 'add' ? 'New Recurring Transaction' : 'Edit Recurring Transaction';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] bg-zinc-900/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden shadow-2xl shadow-black/50">
                {/* Gradient Header */}
                <div className={`bg-gradient-to-b p-4 pb-3 ${colors.gradient}`}>
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.border} border`}>
                                <Repeat className={`h-4 w-4 ${colors.accent}`} />
                            </div>
                            <DialogTitle className="text-base font-semibold text-white">{title}</DialogTitle>
                        </div>
                        <DialogDescription className="sr-only">
                            {mode === 'add' ? 'Set up a recurring transaction schedule.' : 'Update the recurring transaction.'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Type Toggle */}
                    <div className="flex gap-1 p-0.5 bg-background/30 backdrop-blur rounded-lg mt-3 border border-white/5">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 py-2 px-4 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${type === 'expense'
                                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25'
                                : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            <ArrowDownCircle className="h-3 w-3" />
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 py-2 px-4 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${type === 'income'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25'
                                : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            <ArrowUpCircle className="h-3 w-3" />
                            Income
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-4 pt-3 space-y-3">
                    {/* Name */}
                    <div>
                        <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Name</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={type === 'income' ? 'e.g. Salary, Freelance' : 'e.g. Rent, Netflix'}
                            required
                            autoFocus
                            className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 focus:border-white/30"
                        />
                    </div>

                    {/* Amount + Frequency Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Amount</Label>
                            <div className="relative">
                                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium ${colors.accent}`}>$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (['+', '-', 'e', 'E'].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    placeholder="0.00"
                                    required
                                    className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 pl-7 focus:border-white/30 text-base font-medium"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Frequency</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 max-h-[200px]">
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Start Date + Time Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                required
                                className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 focus:border-white/30 cursor-pointer text-sm"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Time (Optional)</Label>
                            <Input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 focus:border-white/30 cursor-pointer text-sm"
                            />
                        </div>
                    </div>

                    {/* Wallet Selection */}
                    {wallets.length > 0 && (
                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">
                                {type === 'income' ? 'Deposit to' : 'Pay from'}
                            </Label>
                            <Select value={walletId} onValueChange={setWalletId} required>
                                <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10">
                                    <SelectValue placeholder="Select Wallet" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    {wallets.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!walletId && (
                                <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                                    <span>⚠️</span> Please select a wallet
                                </p>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <DialogFooter className="pt-2 gap-2 sm:gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-white hover:bg-white/5 h-9 px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !walletId}
                            className={`h-9 px-5 font-semibold rounded-lg gap-2 bg-gradient-to-r shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${type === 'expense'
                                ? 'from-red-500 to-rose-500 shadow-red-500/25 text-white'
                                : 'from-emerald-500 to-green-500 shadow-emerald-500/25 text-white'
                                }`}
                        >
                            {isSubmitting ? 'Saving...' : (mode === 'add' ? 'Create Rule' : 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
