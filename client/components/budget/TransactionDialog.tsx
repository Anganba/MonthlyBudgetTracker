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
import { ArrowLeftRight, ArrowDown } from "lucide-react";

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
    type?: 'expense' | 'income' | 'transfer';
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

    // State
    const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
    const [category, setCategory] = useState<string>('Food');
    const [name, setName] = useState('');
    const [actual, setActual] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [goalId, setGoalId] = useState<string>('');
    const [walletId, setWalletId] = useState<string>(''); // Source / From
    const [toWalletId, setToWalletId] = useState<string>(''); // Target / To

    useEffect(() => {
        if (open && initialData) {
            // Edit Mode
            setType(initialData.type || 'expense');
            setCategory(initialData.category || 'Food');
            setName(initialData.name || '');
            setActual(initialData.actual?.toString() || '');
            const rawDate = initialData.date || new Date().toISOString();
            setDate(rawDate.split('T')[0]);
            setGoalId(initialData.goalId || '');
            setWalletId(initialData.walletId || '');
            setToWalletId(initialData.toWalletId || '');
        } else if (open && mode === 'add') {
            // Add Mode - Reset
            setType('expense');
            setCategory('Food');
            setName('');
            setActual('');
            setDate(new Date().toISOString().split('T')[0]);
            setGoalId('');

            // Defaults
            if (wallets.length > 0) {
                const cashWallet = wallets.find(w => w.type === 'cash');
                const def = wallets.find(w => w.isDefault);
                setWalletId(cashWallet?.id || def?.id || wallets[0].id);
                // For 'To', pick a different one if possible
                const other = wallets.find(w => w.id !== (cashWallet?.id || def?.id || wallets[0].id));
                setToWalletId(other?.id || '');
            } else {
                setWalletId('');
                setToWalletId('');
            }
        }
    }, [open, initialData, mode, wallets]);

    // Derived state
    const filteredCategories = TRANSACTION_CATEGORIES.filter(cat => {
        if (type === 'income') return cat.type === 'income';
        if (type === 'expense') return cat.type === 'expense' || cat.type === 'savings';
        return true;
    });

    // Reset category when type changes if current category is invalid
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

        // Basic Validation
        if (!name.trim()) {
            toast({
                title: "Description Required",
                description: "Please enter a relevant description for the transaction.",
                variant: "destructive",
            });
            return;
        }
        if (type === 'transfer' || category === 'Savings') {
            if (!walletId || !toWalletId) return; // Need both wallets
            if (walletId === toWalletId) return; // Cannot transfer to self
        }

        // Only send goalId if category is Savings OR type is transfer
        const finalGoalId = (category === 'Savings' || type === 'transfer') ? goalId : undefined;
        const amount = parseFloat(actual) || 0;

        onSubmit({
            id: initialData?.id,
            category: type === 'transfer' ? 'Transfer' : category,
            name,
            type,
            planned: amount,
            actual: amount,
            date,
            goalId: finalGoalId === 'unassigned' ? undefined : finalGoalId,
            walletId: walletId === 'unassigned' || !walletId ? undefined : walletId,
            toWalletId: toWalletId === 'unassigned' || !toWalletId ? undefined : toWalletId
        });
        onOpenChange(false);
    };

    const title = mode === 'add' ? 'Add Transaction' : 'Edit Transaction';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">{title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {mode === 'add' ? 'Enter the details of your new transaction below.' : 'Modify the details of this transaction.'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="expense" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">Expense</TabsTrigger>
                        <TabsTrigger value="income" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Income</TabsTrigger>
                        <TabsTrigger value="transfer" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Transfer</TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Common Fields: Date & Name */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
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
                                        // Prevent +, -, e, E keys
                                        if (['+', '-', 'e', 'E'].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {type !== 'transfer' && (
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                                    <SelectContent>
                                        {filteredCategories.sort((a, b) => a.label.localeCompare(b.label)).map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Description</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'transfer' ? "e.g. Savings Deposit" : "e.g. Grocery"} autoFocus />
                        </div>

                        {/* Wallet Selection Logic */}
                        {(type === 'transfer' || category === 'Savings') ? (
                            <div className="bg-muted/30 p-3 rounded-xl border border-border flex flex-col gap-1">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">From Account</Label>
                                    <Select value={walletId} onValueChange={setWalletId}>
                                        <SelectTrigger className="bg-background h-9 border-muted-foreground/20">
                                            <SelectValue placeholder="Select Source Wallet" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {wallets.map(w => (
                                                <SelectItem key={w.id} value={w.id} disabled={w.id === toWalletId}>
                                                    <span className="font-medium">{w.name}</span>
                                                    <span className="ml-2 text-xs text-muted-foreground">({getWalletLabel(w.type)})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-center -my-1.5 z-20 relative top-2">
                                    <div className="bg-background rounded-full border border-border p-1 shadow-sm">
                                        <ArrowDown className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">To Account</Label>
                                    <Select value={toWalletId} onValueChange={setToWalletId}>
                                        <SelectTrigger className="bg-background h-9 border-muted-foreground/20">
                                            <SelectValue placeholder="Select Target Wallet" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {wallets.map(w => (
                                                <SelectItem key={w.id} value={w.id} disabled={w.id === walletId}>
                                                    <span className="font-medium">{w.name}</span>
                                                    <span className="ml-2 text-xs text-muted-foreground">({getWalletLabel(w.type)})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>{type === 'income' ? 'Deposit to' : 'Pay with'}</Label>
                                <Select value={walletId} onValueChange={setWalletId}>
                                    <SelectTrigger><SelectValue placeholder="Select Wallet" /></SelectTrigger>
                                    <SelectContent>
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Goal Link - Show for Savings OR Transfers */}
                        {(category === 'Savings' || type === 'transfer') && (
                            <div className="space-y-2">
                                <Label>Link to Goal (Optional)</Label>
                                <Select value={goalId} onValueChange={setGoalId}>
                                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">None</SelectItem>
                                        {goals.map(g => (
                                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <DialogFooter className="mt-6 gap-2 sm:gap-0">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit">{mode === 'add' ? 'Save Transaction' : 'Update'}</Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
