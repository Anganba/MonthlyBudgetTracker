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
import { ArrowLeftRight, ArrowDown, Receipt, TrendingUp, ArrowRightLeft, Clock } from "lucide-react";
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
    onSubmit: (data: TransactionData) => void;
    initialData?: TransactionData | null;
    mode?: 'add' | 'edit';
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

export function TransactionDialog({ open, onOpenChange, onSubmit, initialData, mode = 'add' }: TransactionDialogProps) {
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
    const [goalId, setGoalId] = useState<string>('');
    const [walletId, setWalletId] = useState<string>('');
    const [toWalletId, setToWalletId] = useState<string>('');
    const [goalDeductions, setGoalDeductions] = useState<GoalDeduction[]>([]);

    useEffect(() => {
        if (open && initialData) {
            // Map old 'savings' type to 'transfer' for backwards compatibility
            const mappedType = initialData.type === 'savings' ? 'transfer' : (initialData.type || 'expense');
            setType(mappedType as 'expense' | 'income' | 'transfer');
            setCategory(initialData.category || 'Food');
            setName(initialData.name || '');
            setActual(initialData.actual?.toString() || '');
            const rawDate = initialData.date || new Date().toISOString();
            setDate(rawDate.split('T')[0]);
            setGoalId(initialData.goalId || 'unassigned');
            setWalletId(initialData.walletId || '');
            setToWalletId(initialData.toWalletId || '');
        } else if (open && mode === 'add') {
            setType('expense');
            setCategory('Food');
            setName('');
            setActual('');
            setDate(new Date().toISOString().split('T')[0]);
            setGoalId('unassigned');

            if (wallets.length > 0) {
                const cashWallet = wallets.find(w => w.type === 'cash');
                const def = wallets.find(w => w.isDefault);
                setWalletId(cashWallet?.id || def?.id || wallets[0].id);
                const other = wallets.find(w => w.id !== (cashWallet?.id || def?.id || wallets[0].id));
                setToWalletId(other?.id || '');
            } else {
                setWalletId('');
                setToWalletId('');
            }
        }
    }, [open, initialData, mode, wallets]);

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

    const handleSubmit = (e: React.FormEvent) => {
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

        // Generate current timestamp (HH:MM:SS) for new transactions, preserve existing for edits
        const now = new Date();
        const currentTimestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        const timestamp = mode === 'edit' && initialData?.timestamp ? initialData.timestamp : currentTimestamp;

        // No longer need to track locally - frequent categories are calculated from transaction history
        // The server endpoint /api/budget/frequent-categories handles this

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
        onOpenChange(false);
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl text-white flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-xl",
                            type === 'expense' ? 'bg-red-500/20' :
                                type === 'income' ? 'bg-green-500/20' :
                                    'bg-blue-500/20'
                        )}>
                            <TypeIcon className={cn(
                                "h-5 w-5",
                                type === 'expense' ? 'text-red-400' :
                                    type === 'income' ? 'text-green-400' :
                                        'text-blue-400'
                            )} />
                        </div>
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        {mode === 'add' ? 'Enter the details of your new transaction below.' : 'Modify the details of this transaction.'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={type} onValueChange={(v) => handleTypeChange(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4 bg-zinc-800 p-1 rounded-xl">
                        <TabsTrigger
                            value="expense"
                            className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white text-gray-400"
                        >
                            Expense
                        </TabsTrigger>
                        <TabsTrigger
                            value="income"
                            className="rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white text-gray-400"
                        >
                            Income
                        </TabsTrigger>
                        <TabsTrigger
                            value="transfer"
                            className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-400"
                        >
                            Transfer
                        </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-gray-400">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-zinc-800 border-zinc-700 rounded-xl h-11 focus:border-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-gray-400">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={actual}
                                    onChange={(e) => setActual(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (['+', '-', 'e', 'E'].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    className="bg-zinc-800 border-zinc-700 rounded-xl h-11 focus:border-primary"
                                />
                            </div>
                        </div>

                        {type !== 'transfer' && (
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-gray-400">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700 rounded-xl h-11">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700 max-h-[300px]">
                                        {frequentCats.length > 0 && (
                                            <>
                                                <SelectGroup>
                                                    <SelectLabel className="text-xs text-gray-500 flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3" />
                                                        Frequently Used
                                                    </SelectLabel>
                                                    {frequentCats.map((cat) => (
                                                        <SelectItem key={`freq-${cat.id}`} value={cat.id}>
                                                            {cat.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                                <SelectSeparator className="bg-white/10" />
                                                <SelectGroup>
                                                    <SelectLabel className="text-xs text-gray-500">All Categories</SelectLabel>
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
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-400">Description</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={type === 'transfer' ? "e.g. Savings Deposit" : "e.g. Grocery"}
                                autoFocus
                                className="bg-zinc-800 border-zinc-700 rounded-xl h-11 focus:border-primary"
                            />
                        </div>

                        {type === 'transfer' ? (
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">From Account</Label>
                                    <Select value={walletId} onValueChange={setWalletId}>
                                        <SelectTrigger className="bg-zinc-800 border-zinc-700 rounded-xl h-10">
                                            <SelectValue placeholder="Select Source Wallet" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            {wallets.map(w => (
                                                <SelectItem key={w.id} value={w.id} disabled={w.id === toWalletId}>
                                                    <span className="font-medium">{w.name}</span>
                                                    <span className="ml-2 text-xs text-gray-500">({getWalletLabel(w.type)})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Swap Button */}
                                <div className="flex justify-center my-2">
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
                                        className="h-8 px-3 text-xs text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg gap-1.5"
                                    >
                                        <ArrowLeftRight className="h-3.5 w-3.5" />
                                        Swap
                                    </Button>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">
                                        To Account
                                    </Label>
                                    <Select value={toWalletId} onValueChange={setToWalletId}>
                                        <SelectTrigger className="bg-zinc-800 border-zinc-700 rounded-xl h-10">
                                            <SelectValue placeholder="Select Target Wallet" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            {wallets.map(w => (
                                                <SelectItem key={w.id} value={w.id} disabled={w.id === walletId}>
                                                    <span className="font-medium">{w.name}</span>
                                                    <span className="ml-2 text-xs text-gray-500">({getWalletLabel(w.type)})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-gray-400">{type === 'income' ? 'Deposit to' : 'Pay with'}</Label>
                                <Select value={walletId} onValueChange={setWalletId}>
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700 rounded-xl h-11">
                                        <SelectValue placeholder="Select Wallet" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Link to Goal - Only show when depositing to the savings wallet */}
                        {(() => {
                            // Check if the target wallet (destination for transfers, wallet for income) is the savings wallet
                            const targetWalletId = type === 'transfer' ? toWalletId : walletId;
                            const targetWallet = wallets.find(w => w.id === targetWalletId);
                            const isSavingsWallet = targetWallet?.isSavingsWallet === true;

                            // Only show goal linking for income/transfer when depositing to savings wallet
                            // Never show for expense (goals auto-create expenses when fulfilled via Hall of Fame)
                            if (type === 'expense' || !isSavingsWallet) {
                                return null;
                            }

                            return (
                                <div className="space-y-2">
                                    <Label className="text-gray-400">Link to Goal (Optional)</Label>
                                    <Select value={goalId} onValueChange={setGoalId}>
                                        <SelectTrigger className="bg-zinc-800 border-zinc-700 rounded-xl h-11">
                                            <SelectValue placeholder="None" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            <SelectItem value="unassigned">None</SelectItem>
                                            {goals.map(g => (
                                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            );
                        })()}

                        {/* Goal Deduction Selector - Show when withdrawing FROM savings wallet */}
                        {(() => {
                            // Check if source wallet is the savings wallet
                            const sourceWallet = wallets.find(w => w.id === walletId);
                            const isWithdrawingFromSavings = sourceWallet?.isSavingsWallet === true;

                            // For transfers, only show if destination is NOT the savings wallet (i.e., money is leaving savings)
                            // For expenses, always show if source is savings wallet
                            const isTransferOut = type === 'transfer' && !wallets.find(w => w.id === toWalletId)?.isSavingsWallet;
                            const shouldShowDeduction = isWithdrawingFromSavings && (type === 'expense' || isTransferOut);

                            if (!shouldShowDeduction) {
                                return null;
                            }

                            const amount = parseFloat(actual) || 0;
                            const activeGoals = goals.filter(g => g.status === 'active');

                            if (amount <= 0 || activeGoals.length === 0) {
                                return null;
                            }

                            return (
                                <GoalDeductionSelector
                                    goals={activeGoals}
                                    totalAmount={amount}
                                    onDeductionsChange={setGoalDeductions}
                                    currency="$"
                                />
                            );
                        })()}

                        <DialogFooter className="mt-6 gap-2 sm:gap-0 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-primary text-black hover:bg-primary/90 font-bold rounded-xl px-6"
                            >
                                {mode === 'add' ? 'Save Transaction' : 'Update'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
