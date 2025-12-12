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
import { cn } from "@/lib/utils";

export interface TransactionData {
    id?: string;
    category: string;
    name: string;
    planned: number;
    actual: number;
    date: string;
    goalId?: string;
}

interface TransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: TransactionData) => void;
    initialData?: TransactionData | null;
    mode?: 'add' | 'edit';
}

export function TransactionDialog({ open, onOpenChange, onSubmit, initialData, mode = 'add' }: TransactionDialogProps) {
    const { goals } = useGoals();
    const [category, setCategory] = useState<string>('Food');
    const [name, setName] = useState('');
    const [planned, setPlanned] = useState('');
    const [actual, setActual] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [goalId, setGoalId] = useState<string>('');

    useEffect(() => {
        if (open && initialData) {
            setCategory(initialData.category || 'Food');
            setName(initialData.name || '');
            setPlanned(initialData.planned?.toString() || '');
            setActual(initialData.actual?.toString() || '');
            // Safe date formatting: take the YYYY-MM-DD part directly if available, otherwise fallback
            const rawDate = initialData.date || new Date().toISOString();
            setDate(rawDate.split('T')[0]);
            setGoalId(initialData.goalId || '');
        } else if (open && mode === 'add') {
            // Reset defaults for add mode
            setCategory('Food');
            setName('');
            setPlanned('');
            setActual('');
            setDate(new Date().toISOString().split('T')[0]);
            setGoalId('');
        }
    }, [open, initialData, mode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            // Only send goalId if category is Savings
            const finalGoalId = category === 'Savings' ? goalId : undefined;
            const amount = parseFloat(actual) || 0;

            onSubmit({
                id: initialData?.id,
                category,
                name,
                planned: amount, // Set planned = actual since we are hiding planned input
                actual: amount,
                date,
                goalId: finalGoalId
            });
            onOpenChange(false);
        }
    };

    const title = mode === 'add' ? 'Add New Transaction' : 'Edit Transaction';
    const description = mode === 'add'
        ? 'Add a new item to your budget. Select the category and enter the details.'
        : 'Update the details of your transaction.';
    const submitText = mode === 'add' ? 'Add Transaction' : 'Save Changes';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif">{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Paycheck">Paycheck (Income)</SelectItem>
                                    <SelectItem value="Bonus">Bonus (Income)</SelectItem>
                                    <SelectItem value="Debt Added">Debt Added (Income)</SelectItem>

                                    <SelectItem value="Food">Food</SelectItem>
                                    <SelectItem value="Gadgets">Gadgets</SelectItem>
                                    <SelectItem value="Health/medical">Health/medical</SelectItem>
                                    <SelectItem value="Rent">Rent</SelectItem>
                                    <SelectItem value="Transportation">Transportation</SelectItem>
                                    <SelectItem value="Personal">Personal</SelectItem>
                                    <SelectItem value="Cosmetics">Cosmetics</SelectItem>
                                    <SelectItem value="Utilities">Utilities</SelectItem>
                                    <SelectItem value="Travel">Travel</SelectItem>
                                    <SelectItem value="Debt Paid">Debt Paid</SelectItem>
                                    <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                                    <SelectItem value="Remittance">Remittance</SelectItem>
                                    <SelectItem value="Snacks">Snacks</SelectItem>

                                    <SelectItem value="Savings">Savings</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {category === 'Savings' && (
                        <div className="space-y-2">
                            <Label htmlFor="goal">Link to Goal (Optional)</Label>
                            <Select value={goalId} onValueChange={setGoalId}>
                                <SelectTrigger id="goal">
                                    <SelectValue placeholder="Select a goal to contribute to" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">None</SelectItem>
                                    {goals.map((g) => (
                                        <SelectItem key={g.id} value={g.id}>
                                            {g.name} (Target: ${g.targetAmount})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Item Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Groceries, Rent, Paycheck"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="actual">Amount</Label>
                        <Input
                            id="actual"
                            type="number"
                            value={actual}
                            onChange={(e) => setActual(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                        />
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            {submitText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
