import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowLeftRight, ArrowDown, Receipt, TrendingUp, ArrowRightLeft, Clock, Loader2 } from "lucide-react";
import { GoalDeductionSelector, GoalDeduction } from './GoalDeductionSelector';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
    SelectLabel,
    SelectGroup,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useGoals } from '@/hooks/use-goals';
import { useWallets } from '@/hooks/use-wallets';
import { cn } from "@/lib/utils";
import { TRANSACTION_CATEGORIES } from "@/lib/categories";
import { useToast } from "@/components/ui/use-toast";

// Frequent categories tracking - now fetched from server
const MAX_FREQUENT_CATEGORIES = 5;

interface CategoryUsage {
    [categoryId: string]: number;
}

export interface TransactionData {
    id?: string;
    category: string;
    name: string;
    type?: 'expense' | 'income' | 'transfer' | 'savings';
    planned: number;
    actual: number;
    date: string;
    timestamp?: string; // HH:MM:SS format
    goalId?: string;
    walletId?: string;
    toWalletId?: string;
    goalDeductions?: GoalDeduction[]; // For deducting from goals when withdrawing from savings wallet
}

interface TransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: TransactionData) => void | Promise<void>;
    initialData?: TransactionData | null;
    mode?: 'add' | 'edit';
    isSubmitting?: boolean;
}

const getWalletLabel = (type: string) => {
    switch (type) {
        case 'mfs': return 'MFS';
        case 'credit_card': return 'Credit Card';
        case 'debit_card': return 'Debit Card';
        case 'virtual_card': return 'Virtual Card';
        case 'bank': return 'Bank';
        default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
};

export function TransactionDialog({ open, onOpenChange, onSubmit, initialData, mode = 'add', isSubmitting = false }: TransactionDialogProps) {
    const { goals } = useGoals();
    const { wallets } = useWallets();
    const { toast } = useToast();

    // Fetch frequent categories from server (calculated from transaction history)
    const { data: frequentCategoriesData = {} } = useQuery<CategoryUsage>({
        queryKey: ['frequent-categories'],
        queryFn: async () => {
            const res = await fetch('/api/budget/frequent-categories');
            if (!res.ok) return {};
            const json = await res.json();
            return json.data || {};
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
    const [category, setCategory] = useState<string>('Food');
    const [name, setName] = useState('');
    const [actual, setActual] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(() => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    });
    const [goalId, setGoalId] = useState<string>('');
    const [walletId, setWalletId] = useState<string>('');
    const [toWalletId, setToWalletId] = useState<string>('');
    const [goalDeductions, setGoalDeductions] = useState<GoalDeduction[]>([]);

    // Track if we've initialized for this dialog open session
    const [hasInitialized, setHasInitialized] = useState(false);

    // Reset initialization flag when dialog closes
    useEffect(() => {
        if (!open) {
            setHasInitialized(false);
        }
    }, [open]);

    // Main form initialization - only runs once when dialog opens
    useEffect(() => {
        if (!open || hasInitialized) return;

        if (initialData) {
            // Map old 'savings' type to 'transfer' for backwards compatibility
            const mappedType = initialData.type === 'savings' ? 'transfer' : (initialData.type || 'expense');
            setType(mappedType as 'expense' | 'income' | 'transfer');
            setCategory(initialData.category || 'Food');
            setName(initialData.name || '');
            setActual(initialData.actual?.toString() || '');
            const rawDate = initialData.date || new Date().toISOString();
            setDate(rawDate.split('T')[0]);
            // Parse existing timestamp or use current time
            if (initialData.timestamp) {
                setTime(initialData.timestamp.substring(0, 5)); // HH:MM from HH:MM:SS
            } else {
                const now = new Date();
                setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
            }
            setGoalId(initialData.goalId || 'unassigned');
            setWalletId(initialData.walletId || '');
            setToWalletId(initialData.toWalletId || '');
            setHasInitialized(true);
        } else if (mode === 'add') {
            setType('expense');
            setCategory('Food');
            setName('');
            setActual('');
            setDate(new Date().toISOString().split('T')[0]);
            const now = new Date();
            setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
            setGoalId('unassigned');
            setHasInitialized(true);
        }
    }, [open, initialData, mode, hasInitialized]);

    // Separate effect for wallet initialization - only sets wallet if not already set
    useEffect(() => {
        if (open && mode === 'add' && wallets.length > 0 && !walletId) {
            const cashWallet = wallets.find(w => w.type === 'cash');
            const def = wallets.find(w => w.isDefault);
            const defaultWalletId = cashWallet?.id || def?.id || wallets[0].id;
            setWalletId(defaultWalletId);
            const other = wallets.find(w => w.id !== defaultWalletId);
            setToWalletId(other?.id || '');
        }
    }, [open, mode, wallets, walletId]);

    const filteredCategories = TRANSACTION_CATEGORIES.filter(cat => {
        if (type === 'income') return cat.type === 'income';
        if (type === 'expense') return cat.type === 'expense';
        return true;
    });

    // Get frequent categories sorted by usage count (from server data)
    const { frequentCats, remainingCats } = useMemo(() => {
        const usage = frequentCategoriesData;
        const sortedByUsage = filteredCategories
            .filter(cat => usage[cat.id] && usage[cat.id] > 0)
            .sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0))
            .slice(0, MAX_FREQUENT_CATEGORIES);

        const frequentIds = new Set(sortedByUsage.map(c => c.id));
        const remaining = filteredCategories
            .filter(cat => !frequentIds.has(cat.id))
            .sort((a, b) => a.label.localeCompare(b.label));

        return { frequentCats: sortedByUsage, remainingCats: remaining };
    }, [filteredCategories, frequentCategoriesData]);

    // Validate when user tries to select Transfer with only one wallet
    const handleTypeChange = (newType: 'expense' | 'income' | 'transfer') => {
        // Check if user is trying to select Transfer but only has one wallet
        if (newType === 'transfer' && wallets.length <= 1) {
            toast({
                title: "Add Another Wallet First",
                description: "To make transfers, please add at least two wallets from the Wallets page.",
                variant: "destructive",
            });
            return; // Don't change the type
        }
        setType(newType);
    };

    useEffect(() => {
        if (open) {
            const isValid = filteredCategories.some(c => c.id === category);
            if (!isValid && filteredCategories.length > 0) {
                if (type === 'income' && filteredCategories.some(c => c.id === 'Paycheck')) {
                    setCategory('Paycheck');
                } else if (type === 'expense' && filteredCategories.some(c => c.id === 'Food')) {
                    setCategory('Food');
                } else {
                    setCategory(filteredCategories[0].id);
                }
            }
        }
    }, [type, open, category, filteredCategories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: "Description Required",
                description: "Please enter a relevant description for the transaction.",
                variant: "destructive",
            });
            return;
        }

        // Validation for transfers - require two different wallets
        if (type === 'transfer') {
            if (!walletId || !toWalletId) {
                toast({
                    title: "Wallets Required",
                    description: "Both source and destination wallets are required for transfers.",
                    variant: "destructive",
                });
                return;
            }
            if (walletId === toWalletId) {
                toast({
                    title: "Invalid Transfer",
                    description: "Source and destination wallets must be different.",
                    variant: "destructive",
                });
                return;
            }
        }

        const finalGoalId = goalId; // Allow goal linking for all transaction types
        const amount = parseFloat(actual) || 0;

        // Validate amount is greater than 0
        if (amount <= 0) {
            toast({
                title: "Amount Required",
                description: "Please enter an amount greater than $0.",
                variant: "destructive",
            });
            return;
        }

        // Require wallet for expense/income transactions
        const selectedWallet = wallets.find(w => w.id === walletId);
        if ((type === 'expense' || type === 'income') && (!walletId || !selectedWallet)) {
            toast({
                title: "Wallet Required",
                description: "Please select a valid wallet for this transaction.",
                variant: "destructive",
            });
            return;
        }

        // Validate sufficient funds for expenses and transfers
        if ((type === 'expense' || type === 'transfer') && walletId) {
            const sourceWallet = wallets.find(w => w.id === walletId);
            // Check if wallet exists and balance is insufficient
            // If editing, we need to consider the original amount if it was from the same wallet
            let availableBalance = sourceWallet?.balance || 0;

            // If editing and using the same wallet, add back the original actual amount to checks
            if (mode === 'edit' && initialData && initialData.walletId === walletId) {
                // Determine if the original transaction deducted from this wallet
                const initialType = initialData.type || 'expense';
                if (initialType === 'expense' || initialType === 'transfer' || initialType === 'savings') {
                    availableBalance += (initialData.actual || 0);
                }
            }

            if (sourceWallet && amount > availableBalance) {
                toast({
                    title: "Insufficient Funds",
                    description: `Wallet "${sourceWallet.name}" has insufficient funds ($${availableBalance.toLocaleString()}) for this transaction.`,
                    variant: "destructive",
                });
                return;
            }
        }

        // Check for no changes in edit mode
        if (mode === 'edit' && initialData) {
            // Compare dates by extracting just the YYYY-MM-DD part
            const initialDatePart = (initialData.date || '').split('T')[0];
            // Map types consistently (savings is displayed as transfer)
            const initialType = initialData.type === 'savings' ? 'transfer' : (initialData.type || 'expense');

            const noChanges =
                name === initialData.name &&
                type === initialType &&
                category === initialData.category &&
                amount === initialData.actual &&
                date === initialDatePart &&
                time === (initialData.timestamp || '').substring(0, 5) &&
                (walletId || '') === (initialData.walletId || '') &&
                (toWalletId || '') === (initialData.toWalletId || '') &&
                // Treat 'unassigned' as equivalent to undefined/empty for goalId
                ((finalGoalId === 'unassigned' ? '' : finalGoalId) || '') === (initialData.goalId || '');

            if (noChanges) {
                toast({
                    title: "No Changes",
                    description: "No changes were made to this transaction.",
                });
                // Small delay to ensure toast renders before dialog closes
                setTimeout(() => onOpenChange(false), 100);
                return;
            }
        }

        // Generate timestamp from the time input field (HH:MM -> HH:MM:SS)
        const timestamp = time ? `${time}:00` : undefined;

        // No longer need to track locally - frequent categories are calculated from transaction history
        // The server endpoint /api/budget/frequent-categories handles this

        // Close dialog immediately (optimistic update will handle UI)
        onOpenChange(false);

        // Fire and forget - don't await so dialog closes instantly
        // The optimistic update in use-transactions hook handles immediate UI feedback
        onSubmit({
            id: initialData?.id,
            category: type === 'transfer' ? 'Transfer' : category,
            name,
            type,
            planned: amount,
            actual: amount,
            date,
            timestamp,
            goalId: finalGoalId === 'unassigned' || !finalGoalId ? undefined : finalGoalId,
            walletId: walletId === 'unassigned' || !walletId ? undefined : walletId,
            toWalletId: toWalletId === 'unassigned' || !toWalletId ? undefined : toWalletId,
            goalDeductions: goalDeductions.length > 0 ? goalDeductions : undefined
        });
    };

    const title = mode === 'add' ? 'Add Transaction' : 'Edit Transaction';
    const getTypeIcon = () => {
        switch (type) {
            case 'income': return TrendingUp;
            case 'transfer': return ArrowRightLeft;
            default: return Receipt;
        }
    };
    const TypeIcon = getTypeIcon();

    // Type-based color schemes
    const typeColors = {
        expense: {
            gradient: 'from-red-500/20 via-rose-500/10 to-transparent',
            border: 'border-red-500/30',
            accent: 'text-red-400',
            bg: 'bg-red-500/10',
            glow: 'shadow-red-500/20',
        },
        income: {
            gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
            border: 'border-emerald-500/30',
            accent: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            glow: 'shadow-emerald-500/20',
        },
        transfer: {
            gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
            border: 'border-blue-500/30',
            accent: 'text-blue-400',
            bg: 'bg-blue-500/10',
            glow: 'shadow-blue-500/20',
        },
    };

    const colors = typeColors[type];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "sm:max-w-[420px] bg-zinc-900/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden",
                "shadow-2xl shadow-black/50"
            )}>
                {/* Gradient Header */}
                <div className={cn("bg-gradient-to-b p-4 pb-3", colors.gradient)}>
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className={cn("p-1.5 rounded-lg", colors.bg, colors.border, "border")}>
                                <TypeIcon className={cn("h-4 w-4", colors.accent)} />
                            </div>
                            <DialogTitle className="text-base font-semibold text-white">{title}</DialogTitle>
                        </div>
                        <DialogDescription className="sr-only">
                            {mode === 'add' ? 'Enter the details of your new transaction below.' : 'Modify the details of this transaction.'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Type Toggle */}
                    <Tabs value={type} onValueChange={(v) => handleTypeChange(v as any)} className="w-full mt-3">
                        <TabsList className="grid w-full grid-cols-3 bg-black/30 backdrop-blur p-0.5 rounded-lg h-9 border border-white/5">
                            <TabsTrigger
                                value="expense"
                                className={cn(
                                    "rounded-md text-xs font-medium transition-all h-8",
                                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500",
                                    "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/25",
                                    "text-gray-400 hover:text-gray-300"
                                )}
                            >
                                <Receipt className="h-3 w-3 mr-1" />
                                Expense
                            </TabsTrigger>
                            <TabsTrigger
                                value="income"
                                className={cn(
                                    "rounded-md text-xs font-medium transition-all h-8",
                                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500",
                                    "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25",
                                    "text-gray-400 hover:text-gray-300"
                                )}
                            >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Income
                            </TabsTrigger>
                            <TabsTrigger
                                value="transfer"
                                className={cn(
                                    "rounded-md text-xs font-medium transition-all h-8",
                                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500",
                                    "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25",
                                    "text-gray-400 hover:text-gray-300"
                                )}
                            >
                                <ArrowRightLeft className="h-3 w-3 mr-1" />
                                Transfer
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-4 pt-3 space-y-3">
                    {/* Amount + Date + Time Row */}
                    <div className="grid grid-cols-10 gap-2">
                        <div className="col-span-4">
                            <Label htmlFor="amount" className="text-gray-400 text-xs font-medium mb-1.5 block">Amount</Label>
                            <div className="relative">
                                <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium", colors.accent)}>$</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={actual}
                                    onChange={(e) => setActual(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (['+', '-', 'e', 'E'].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    className={cn(
                                        "bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 pl-7",
                                        "focus:border-white/30 focus:ring-1 focus:ring-white/10",
                                        "text-base font-medium"
                                    )}
                                />
                            </div>
                            {(() => {
                                const sourceWallet = wallets.find(w => w.id === walletId);
                                const currentAmount = parseFloat(actual) || 0;
                                // Calculate available balance considering edits
                                let availableBalance = sourceWallet?.balance || 0;
                                if (mode === 'edit' && initialData && initialData.walletId === walletId) {
                                    const initialType = initialData.type || 'expense';
                                    if (initialType === 'expense' || initialType === 'transfer' || initialType === 'savings') {
                                        availableBalance += (initialData.actual || 0);
                                    }
                                }

                                if ((type === 'expense' || type === 'transfer') && sourceWallet && currentAmount > availableBalance) {
                                    return (
                                        <div className="absolute top-full left-0 mt-1 text-[10px] text-red-400 flex items-center gap-1 font-medium animate-in fade-in slide-in-from-top-1">
                                            <span>⚠️ Insufficient funds (${availableBalance.toLocaleString()})</span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <div className="col-span-3">
                            <Label htmlFor="date" className="text-gray-400 text-xs font-medium mb-1.5 block">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 focus:border-white/30 cursor-pointer text-sm"
                            />
                        </div>
                        <div className="col-span-3">
                            <Label htmlFor="time" className="text-gray-400 text-xs font-medium mb-1.5 block">Time</Label>
                            <Input
                                id="time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 focus:border-white/30 cursor-pointer text-sm"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="name" className="text-gray-400 text-xs font-medium mb-1.5 block">Description</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={type === 'transfer' ? "e.g. Savings Deposit" : "e.g. Grocery shopping"}
                            autoFocus
                            className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 focus:border-white/30"
                        />
                    </div>

                    {/* Category + Wallet for Expense/Income */}
                    {type !== 'transfer' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700 max-h-[260px]">
                                        {frequentCats.length > 0 && (
                                            <>
                                                <SelectGroup>
                                                    <SelectLabel className="text-xs text-gray-500 flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3" />
                                                        Frequent
                                                    </SelectLabel>
                                                    {frequentCats.map((cat) => (
                                                        <SelectItem key={`freq-${cat.id}`} value={cat.id}>
                                                            {cat.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                                <SelectSeparator className="bg-white/10" />
                                                <SelectGroup>
                                                    <SelectLabel className="text-xs text-gray-500">All</SelectLabel>
                                                    {remainingCats.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </>
                                        )}
                                        {frequentCats.length === 0 && (
                                            remainingCats.concat(frequentCats).sort((a, b) => a.label.localeCompare(b.label)).map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">
                                    {type === 'income' ? 'Deposit to' : 'Pay with'}
                                </Label>
                                <Select value={walletId} onValueChange={setWalletId}>
                                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10">
                                        <SelectValue placeholder="Select Wallet" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Transfer Section */}
                    {type === 'transfer' && (
                        <div className={cn(
                            "relative p-3 rounded-xl overflow-hidden",
                            "bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent",
                            "border border-blue-500/20"
                        )}>
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <Label className="text-gray-400 text-xs font-medium mb-1.5 block">From</Label>
                                    <Select value={walletId} onValueChange={setWalletId}>
                                        <SelectTrigger className="bg-zinc-800/70 border-zinc-700/50 rounded-lg h-10">
                                            <SelectValue placeholder="Source" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            {wallets.map(w => (
                                                <SelectItem key={w.id} value={w.id} disabled={w.id === toWalletId}>
                                                    <span className="font-medium">{w.name}</span>
                                                    <span className="ml-1.5 text-[10px] text-gray-500">({getWalletLabel(w.type)})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const temp = walletId;
                                        setWalletId(toWalletId);
                                        setToWalletId(temp);
                                    }}
                                    disabled={!walletId || !toWalletId}
                                    className={cn(
                                        "h-10 w-10 p-0 rounded-full",
                                        "bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30",
                                        "text-blue-400 hover:text-blue-300",
                                        "transition-all hover:scale-105 active:scale-95",
                                        "disabled:opacity-50 disabled:hover:scale-100"
                                    )}
                                >
                                    <ArrowLeftRight className="h-4 w-4" />
                                </Button>
                                <div className="flex-1">
                                    <Label className="text-gray-400 text-xs font-medium mb-1.5 block">To</Label>
                                    <Select value={toWalletId} onValueChange={setToWalletId}>
                                        <SelectTrigger className="bg-zinc-800/70 border-zinc-700/50 rounded-lg h-10">
                                            <SelectValue placeholder="Target" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            {wallets.map(w => (
                                                <SelectItem key={w.id} value={w.id} disabled={w.id === walletId}>
                                                    <span className="font-medium">{w.name}</span>
                                                    <span className="ml-1.5 text-[10px] text-gray-500">({getWalletLabel(w.type)})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Link to Goal */}
                    {(() => {
                        const targetWalletId = type === 'transfer' ? toWalletId : walletId;
                        const targetWallet = wallets.find(w => w.id === targetWalletId);
                        const isSavingsWallet = targetWallet?.isSavingsWallet === true;

                        if (type === 'expense' || !isSavingsWallet) {
                            return null;
                        }

                        return (
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Link to Goal (Optional)</Label>
                                <Select value={goalId} onValueChange={setGoalId}>
                                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10">
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        <SelectItem value="unassigned">None</SelectItem>
                                        {goals.filter(g => g.status === 'active' || !g.status).map(g => (
                                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        );
                    })()}

                    {/* Goal Deduction Selector */}
                    {(() => {
                        const sourceWallet = wallets.find(w => w.id === walletId);
                        const isWithdrawingFromSavings = sourceWallet?.isSavingsWallet === true;
                        const isTransferOut = type === 'transfer' && !wallets.find(w => w.id === toWalletId)?.isSavingsWallet;
                        const shouldShowDeduction = isWithdrawingFromSavings && (type === 'expense' || isTransferOut);

                        if (!shouldShowDeduction) return null;

                        const amount = parseFloat(actual) || 0;
                        const activeGoals = goals.filter(g => g.status === 'active');

                        if (amount <= 0 || activeGoals.length === 0) return null;

                        return (
                            <GoalDeductionSelector
                                goals={activeGoals}
                                totalAmount={amount}
                                onDeductionsChange={setGoalDeductions}
                                currency="$"
                            />
                        );
                    })()}

                    {/* Footer */}
                    <DialogFooter className="pt-2 gap-2 sm:gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-gray-400 hover:text-white hover:bg-white/5 h-9 px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={cn(
                                "h-9 px-5 font-semibold rounded-lg gap-2",
                                "bg-gradient-to-r shadow-lg transition-all",
                                "hover:opacity-90 active:scale-[0.98]",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                type === 'expense' && "from-red-500 to-rose-500 shadow-red-500/25 text-white",
                                type === 'income' && "from-emerald-500 to-green-500 shadow-emerald-500/25 text-white",
                                type === 'transfer' && "from-blue-500 to-indigo-500 shadow-blue-500/25 text-white"
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                mode === 'add' ? 'Add Transaction' : 'Update'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
