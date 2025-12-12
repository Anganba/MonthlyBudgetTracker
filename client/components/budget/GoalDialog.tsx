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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif">{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Goal Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., New Car, Holiday"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="target">Target Amount</Label>
                            <Input
                                id="target"
                                type="number"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="current">Current Saved</Label>
                            <Input
                                id="current"
                                type="number"
                                value={currentAmount}
                                onChange={(e) => setCurrentAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>
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
