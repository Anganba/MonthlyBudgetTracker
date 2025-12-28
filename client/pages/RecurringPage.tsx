import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RecurringTransaction } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Repeat, Calendar, DollarSign, Clock, Pencil, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWallets } from "@/hooks/use-wallets";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BudgetLimitsSection } from "@/components/budget/BudgetLimitsSection";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";

export default function RecurringPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
    const [date] = useState(new Date());
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthName = monthNames[date.getMonth()];
    const currentYear = date.getFullYear();

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

    // Stats
    const incomeCategories = INCOME_CATEGORIES.map(c => c.id);
    const totalMonthlyExpenses = recurringList?.filter(r => r.frequency === 'monthly' && !incomeCategories.includes(r.category)).reduce((sum, r) => sum + r.amount, 0) || 0;
    const totalMonthlyIncome = recurringList?.filter(r => r.frequency === 'monthly' && incomeCategories.includes(r.category)).reduce((sum, r) => sum + r.amount, 0) || 0;
    const totalRules = recurringList?.length || 0;

    // Format next run date nicely
    const formatNextRun = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'MMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8 relative overflow-hidden">
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
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 rounded-xl md:rounded-2xl px-4 md:px-6 h-10 md:h-11 font-bold shadow-lg shadow-cyan-500/30 gap-1.5 md:gap-2 text-sm w-full sm:w-auto transition-all hover:scale-[1.02]"
                    >
                        <Plus className="h-4 w-4" /> Add Recurring
                    </Button>
                </div>

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
                                <p className="text-[10px] md:text-sm text-emerald-300/70">Monthly Income</p>
                                <p className="text-lg md:text-2xl font-bold text-emerald-400">${totalMonthlyIncome.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-xl md:rounded-2xl bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-pink-500/5 border border-rose-500/30 p-3 md:p-6 shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-rose-500/30 to-pink-500/20 shadow-inner">
                                <ArrowDownCircle className="h-4 w-4 md:h-6 md:w-6 text-rose-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-rose-300/70">Monthly Expenses</p>
                                <p className="text-lg md:text-2xl font-bold text-rose-400">${totalMonthlyExpenses.toLocaleString()}</p>
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
                                <p className="text-lg md:text-2xl font-bold text-white">{currentMonthName}</p>
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
                                const isIncome = incomeCategories.includes(item.category);
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
                                                    onClick={() => deleteMutation.mutate(item.id)}
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
                    <BudgetLimitsSection month={currentMonthName} year={currentYear} />
                </div>
            </div>

            <RecurringDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onSubmit={(data) => createMutation.mutate(data)}
                mode="add"
            />

            <RecurringDialog
                open={!!editingItem}
                onOpenChange={(open) => !open && setEditingItem(null)}
                onSubmit={(data) => updateMutation.mutate({ id: editingItem?.id, ...data })}
                initialData={editingItem}
                mode="edit"
            />
        </div>
    );
}

interface RecurringDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => void;
    initialData?: RecurringTransaction | null;
    mode: 'add' | 'edit';
}

function RecurringDialog({ open, onOpenChange, onSubmit, initialData, mode }: RecurringDialogProps) {
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Rent");
    const [frequency, setFrequency] = useState("monthly");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [walletId, setWalletId] = useState<string>("");
    const { wallets } = useWallets();

    // Initialize form when editing
    useEffect(() => {
        if (open && initialData) {
            const incomeCategories = INCOME_CATEGORIES.map(c => c.id);
            setType(incomeCategories.includes(initialData.category) ? 'income' : 'expense');
            setName(initialData.name);
            setAmount(initialData.amount.toString());
            setCategory(initialData.category);
            setFrequency(initialData.frequency);
            setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
            setWalletId(initialData.walletId || "");
        } else if (open && mode === 'add') {
            // Reset form for new entries
            setType('expense');
            setName("");
            setAmount("");
            setCategory("Rent");
            setFrequency("monthly");
            setStartDate(new Date().toISOString().split('T')[0]);
            setWalletId("");
        }
    }, [open, initialData, mode]);

    // Update category when type changes
    useEffect(() => {
        if (type === 'income') {
            setCategory(INCOME_CATEGORIES[0]?.id || 'Paycheck');
        } else {
            setCategory(EXPENSE_CATEGORIES[0]?.id || 'Rent');
        }
    }, [type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            amount: parseFloat(amount),
            category,
            frequency,
            startDate,
            walletId: walletId || undefined
        });
    };

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-xl font-serif flex items-center gap-2">
                        <Repeat className="h-5 w-5 text-primary" />
                        {mode === 'add' ? 'New Recurring Transaction' : 'Edit Recurring Transaction'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {mode === 'add' ? 'Automatically create this transaction on a schedule.' : 'Update the recurring transaction details.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Type Toggle */}
                    <div className="flex gap-2 p-1 bg-zinc-800 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${type === 'expense'
                                ? 'bg-orange-500 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${type === 'income'
                                ? 'bg-green-500 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Income
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300">Name</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={type === 'income' ? 'e.g. Salary, Freelance' : 'e.g. Rent, Netflix'}
                            required
                            className="h-11 bg-zinc-800 border-zinc-700 focus:border-primary rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Amount</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                className="h-11 bg-zinc-800 border-zinc-700 focus:border-primary rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">Frequency</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger className="h-11 bg-zinc-800 border-zinc-700 rounded-xl">
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

                    <div className="space-y-2">
                        <Label className="text-gray-300">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-11 bg-zinc-800 border-zinc-700 rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 max-h-[200px]">
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300">Start Date</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            required
                            className="h-11 bg-zinc-800 border-zinc-700 focus:border-primary rounded-xl"
                        />
                    </div>

                    {wallets.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-gray-300">{type === 'income' ? 'Deposit to Wallet' : 'Pay from Wallet'} (Optional)</Label>
                            <Select value={walletId} onValueChange={setWalletId}>
                                <SelectTrigger className="h-11 bg-zinc-800 border-zinc-700 rounded-xl">
                                    <SelectValue placeholder="Select Wallet" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="unassigned">None</SelectItem>
                                    {wallets.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name} ({w.type})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-primary text-black hover:bg-primary/90 font-bold rounded-xl">
                            {mode === 'add' ? 'Create Rule' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
