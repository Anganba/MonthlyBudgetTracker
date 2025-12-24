import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Goal } from '@shared/api';
import { Target } from 'lucide-react';

interface GoalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Partial<Goal>) => void;
    initialData?: Goal | null;
    mode?: 'add' | 'edit';
}

export function GoalDialog({ open, onOpenChange, onSubmit, initialData, mode = 'add' }: GoalDialogProps) {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');

    useEffect(() => {
        if (open && initialData) {
            setName(initialData.name || '');
            setTargetAmount(initialData.targetAmount?.toString() || '');
            setCurrentAmount(initialData.currentAmount?.toString() || '');
        } else if (open && mode === 'add') {
            setName('');
            setTargetAmount('');
            setCurrentAmount('');
        }
    }, [open, initialData, mode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && targetAmount) {
            onSubmit({
                id: initialData?.id,
                name,
                targetAmount: parseFloat(targetAmount) || 0,
                currentAmount: parseFloat(currentAmount) || 0,
            });
            onOpenChange(false);
        }
    };

    const title = mode === 'add' ? 'Add New Goal' : 'Edit Goal';
    const description = mode === 'add'
        ? 'Set a new financial goal to track your progress.'
        : 'Update your goal details.';
    const submitText = mode === 'add' ? 'Create Goal' : 'Save Changes';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/20">
                            <Target className="h-5 w-5 text-primary" />
                        </div>
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-400">Goal Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., New Car, Holiday"
                            autoFocus
                            className="bg-zinc-800 border-zinc-700 rounded-xl h-11 focus:border-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="target" className="text-gray-400">Target Amount</Label>
                            <Input
                                id="target"
                                type="number"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                className="bg-zinc-800 border-zinc-700 rounded-xl h-11 focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="current" className="text-gray-400">Current Saved</Label>
                            <Input
                                id="current"
                                type="number"
                                value={currentAmount}
                                onChange={(e) => setCurrentAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                className="bg-zinc-800 border-zinc-700 rounded-xl h-11 focus:border-primary"
                            />
                        </div>
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
                            {submitText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
