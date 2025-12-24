import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RecurringTransaction } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Repeat, Calendar, DollarSign, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWallets } from "@/hooks/use-wallets";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BudgetLimitsSection } from "@/components/budget/BudgetLimitsSection";

export default function RecurringPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
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

    // Stats
    const totalMonthly = recurringList?.filter(r => r.frequency === 'monthly').reduce((sum, r) => sum + r.amount, 0) || 0;
    const totalRules = recurringList?.length || 0;

    if (isLoading) return (
        <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-serif text-white">Recurring & Budget</h1>
                        <p className="text-gray-500 mt-1">Manage automatic transactions and monthly limits</p>
                    </div>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-primary text-black hover:bg-primary/90 rounded-2xl px-6 h-11 font-bold shadow-lg shadow-primary/20 gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Recurring
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/20">
                                <Repeat className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Active Rules</p>
                                <p className="text-2xl font-bold text-white">{totalRules}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/20">
                                <DollarSign className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Monthly Total</p>
                                <p className="text-2xl font-bold text-white">${totalMonthly.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/20">
                                <Calendar className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Current Period</p>
                                <p className="text-2xl font-bold text-white">{currentMonthName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recurring Rules */}
                <div className="rounded-2xl bg-zinc-900/50 border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/20">
                                <Repeat className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-white font-serif">Active Rules</h2>
                        </div>
                    </div>

                    {recurringList?.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="p-4 rounded-2xl bg-white/5 w-fit mx-auto mb-4">
                                <Repeat className="h-12 w-12 text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No recurring transactions</h3>
                            <p className="text-gray-500 mb-6">Set up automatic transactions to save time</p>
                            <Button
                                onClick={() => setIsAddOpen(true)}
                                className="bg-primary text-black hover:bg-primary/90 rounded-2xl px-6 font-bold"
                            >
                                Create Your First Rule
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {recurringList?.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-white/10">
                                            <Clock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white text-lg">{item.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-sm text-gray-400">{item.category}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{item.frequency}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 md:gap-8">
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-white">${item.amount.toFixed(2)}</p>
                                            <p className="text-xs text-gray-500">Next: {item.nextRunDate}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-400 hover:bg-red-500/20 rounded-xl"
                                            onClick={() => deleteMutation.mutate(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Budget Limits Section */}
                <div className="mt-8">
                    <BudgetLimitsSection month={currentMonthName} year={currentYear} />
                </div>
            </div>

            <AddRecurringDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onSubmit={(data) => createMutation.mutate(data)}
            />
        </div>
    );
}

function AddRecurringDialog({ open, onOpenChange, onSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (data: any) => void }) {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Rent");
    const [frequency, setFrequency] = useState("monthly");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [walletId, setWalletId] = useState<string>("");
    const { wallets } = useWallets();

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-xl font-serif flex items-center gap-2">
                        <Repeat className="h-5 w-5 text-primary" />
                        New Recurring Transaction
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Automatically create this transaction on a schedule.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-gray-300">Name</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Rent, Netflix"
                            required
                            className="h-12 bg-zinc-800 border-zinc-700 focus:border-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-gray-300">Amount</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            className="h-12 bg-zinc-800 border-zinc-700 focus:border-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-gray-300">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-12 bg-zinc-800 border-zinc-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="Rent">Rent</SelectItem>
                                <SelectItem value="Utilities">Utilities</SelectItem>
                                <SelectItem value="Subscriptions">Subscriptions</SelectItem>
                                <SelectItem value="Income">Income/Salary</SelectItem>
                                <SelectItem value="Internet">Internet</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Frequency</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger className="h-12 bg-zinc-800 border-zinc-700">
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
                        <div className="space-y-2">
                            <Label className="text-gray-300">Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                required
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-primary"
                            />
                        </div>
                    </div>

                    {wallets.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-gray-300">Wallet (Optional)</Label>
                            <Select value={walletId} onValueChange={setWalletId}>
                                <SelectTrigger className="h-12 bg-zinc-800 border-zinc-700">
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
                        <Button type="submit" className="bg-primary text-black hover:bg-primary/90 font-bold">Create Rule</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
