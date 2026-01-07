import React, { useState, useEffect } from 'react';
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
import { ArrowLeftRight, ArrowDown, Receipt, TrendingUp, ArrowRightLeft, PiggyBank } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useGoals } from '@/hooks/use-goals';
import { useWallets } from '@/hooks/use-wallets';
import { cn } from "@/lib/utils";
import { TRANSACTION_CATEGORIES } from "@/lib/categories";
import { useToast } from "@/components/ui/use-toast";

export interface TransactionData {
    id?: string;
    category: string;
    name: string;
    type?: 'expense' | 'income' | 'transfer' | 'savings';
    planned: number;
    actual: number;
    date: string;
    goalId?: string;
    walletId?: string;
    toWalletId?: string;
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

    const [type, setType] = useState<'expense' | 'income' | 'transfer' | 'savings'>('expense');
    const [category, setCategory] = useState<string>('Food');
    const [name, setName] = useState('');
    const [actual, setActual] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [goalId, setGoalId] = useState<string>('');
    const [walletId, setWalletId] = useState<string>('');
    const [toWalletId, setToWalletId] = useState<string>('');

    useEffect(() => {
        if (open && initialData) {
            setType(initialData.type || 'expense');
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
        if (type === 'savings') return cat.type === 'savings';
        return true;
    });

    // Validate when user tries to select Savings type with only one wallet
    const handleTypeChange = (newType: 'expense' | 'income' | 'transfer' | 'savings') => {
        // Check if user is trying to select Savings but only has one wallet
        if (newType === 'savings' && wallets.length <= 1) {
            toast({
                title: "Add a Savings Wallet First",
                description: "To track savings, please add a dedicated savings wallet (e.g., a savings account or goal-based wallet) from the Wallets page. Then you can transfer money between your wallets.",
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

        // Validation for transfers and savings - both require two different wallets
        if (type === 'transfer' || type === 'savings') {
            if (!walletId || !toWalletId) {
                toast({
                    title: "Wallets Required",
                    description: `Both source and destination wallets are required for ${type === 'transfer' ? 'transfers' : 'savings'}.`,
                    variant: "destructive",
                });
                return;
            }
            if (walletId === toWalletId) {
                toast({
                    title: type === 'transfer' ? "Invalid Transfer" : "Invalid Savings",
                    description: "Source and destination wallets must be different.",
                    variant: "destructive",
                });
                return;
            }
        }

        const finalGoalId = goalId; // Allow goal linking for all transaction types
        const amount = parseFloat(actual) || 0;

        onSubmit({
            id: initialData?.id,
            category: type === 'transfer' ? 'Transfer' : type === 'savings' ? 'Savings' : category,
            name,
            type,
            planned: amount,
            actual: amount,
            date,
            goalId: finalGoalId === 'unassigned' || !finalGoalId ? undefined : finalGoalId,
            walletId: walletId === 'unassigned' || !walletId ? undefined : walletId,
            toWalletId: toWalletId === 'unassigned' || !toWalletId ? undefined : toWalletId
        });
        onOpenChange(false);
    };

    const title = mode === 'add' ? 'Add Transaction' : 'Edit Transaction';
    const getTypeIcon = () => {
        switch (type) {
            case 'income': return TrendingUp;
            case 'transfer': return ArrowRightLeft;
            case 'savings': return PiggyBank;
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
                                    type === 'savings' ? 'bg-purple-500/20' :
                                        'bg-blue-500/20'
                        )}>
                            <TypeIcon className={cn(
                                "h-5 w-5",
                                type === 'expense' ? 'text-red-400' :
                                    type === 'income' ? 'text-green-400' :
                                        type === 'savings' ? 'text-purple-400' :
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
                    <TabsList className="grid w-full grid-cols-4 mb-4 bg-zinc-800 p-1 rounded-xl">
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
                            value="savings"
                            className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white text-gray-400"
                        >
                            Savings
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

                        {type !== 'transfer' && type !== 'savings' && (
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-gray-400">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700 rounded-xl h-11">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {filteredCategories.sort((a, b) => a.label.localeCompare(b.label)).map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                        ))}
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
                                placeholder={type === 'transfer' ? "e.g. Savings Deposit" : type === 'savings' ? "e.g. Monthly Savings" : "e.g. Grocery"}
                                autoFocus
                                className="bg-zinc-800 border-zinc-700 rounded-xl h-11 focus:border-primary"
                            />
                        </div>

                        {(type === 'transfer' || type === 'savings') ? (
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

                        {/* Link to Goal - Available for all transaction types */}
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
