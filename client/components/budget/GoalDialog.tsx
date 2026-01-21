import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Goal } from '@shared/api';
import { Target } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '@/lib/categories';
import { getCategoryIcon } from '@/lib/category-icons';

// Helper to get category config for display
export function getCategoryConfig(categoryId?: string) {
    const category = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
    if (category) {
        return {
            id: category.id,
            label: category.label,
            icon: getCategoryIcon(category.id),
            color: 'text-primary bg-primary/20'
        };
    }
    // Default fallback
    return {
        id: 'Other',
        label: 'Other',
        icon: Target,
        color: 'text-gray-400 bg-gray-500/20'
    };
}

// Export categories for external use (now using expense categories)
export const GOAL_CATEGORIES = EXPENSE_CATEGORIES.map(cat => ({
    id: cat.id,
    label: cat.label,
    icon: getCategoryIcon(cat.id),
    color: 'text-primary bg-primary/20'
}));

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
    const [targetDate, setTargetDate] = useState('');
    const [category, setCategory] = useState<string>('Other');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (open && initialData) {
            setName(initialData.name || '');
            setTargetAmount(initialData.targetAmount?.toString() || '');
            setTargetDate(initialData.targetDate?.split('T')[0] || '');
            setCategory(initialData.category || 'Other');
            setDescription(initialData.description || '');
        } else if (open && mode === 'add') {
            setName('');
            setTargetAmount('');
            setTargetDate('');
            setCategory('Other');
            setDescription('');
        }
    }, [open, initialData, mode]);

    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate name
        if (!name.trim()) {
            toast({
                title: "Goal Name Required",
                description: "Please enter a name for your goal.",
                variant: "destructive",
            });
            return;
        }

        // Validate target amount
        const parsedAmount = parseFloat(targetAmount);
        if (!targetAmount || parsedAmount <= 0) {
            toast({
                title: "Target Amount Required",
                description: "Please enter a target amount greater than $0.",
                variant: "destructive",
            });
            return;
        }

        // Check for no changes in edit mode
        if (mode === 'edit' && initialData) {
            const noChanges =
                name === (initialData.name || '') &&
                parsedAmount === (initialData.targetAmount || 0) &&
                targetDate === (initialData.targetDate?.split('T')[0] || '') &&
                category === (initialData.category || 'Other') &&
                description === (initialData.description || '');

            if (noChanges) {
                toast({
                    title: "No Changes",
                    description: "No changes were made to this goal.",
                });
                setTimeout(() => onOpenChange(false), 100);
                return;
            }
        }

        onSubmit({
            id: initialData?.id,
            name,
            targetAmount: parsedAmount,
            currentAmount: initialData?.currentAmount || 0,
            targetDate: targetDate || undefined,
            category: category as any,
            description: description || undefined,
            startedAt: initialData?.startedAt || new Date().toISOString(),
        });
        onOpenChange(false);
    };

    const title = mode === 'add' ? 'Add New Goal' : 'Edit Goal';
    const description_text = mode === 'add'
        ? 'Set a new financial goal to track your progress.'
        : 'Update your goal details.';
    const submitText = mode === 'add' ? 'Create Goal' : 'Save Changes';

    const selectedCategory = getCategoryConfig(category);
    const CategoryIcon = selectedCategory.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] bg-zinc-900/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto">
                {/* Gradient Header */}
                <div className="bg-gradient-to-b from-emerald-500/20 via-green-500/10 to-transparent p-4 pb-3">
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <Target className="h-4 w-4 text-emerald-400" />
                            </div>
                            <DialogTitle className="text-base font-semibold text-white">{title}</DialogTitle>
                        </div>
                        <DialogDescription className="sr-only">
                            {description_text}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-4 pt-3 space-y-3">
                    {/* Category */}
                    <div>
                        <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10">
                                <SelectValue placeholder="Select a category">
                                    {category && (
                                        <div className="flex items-center gap-2">
                                            <CategoryIcon className="h-4 w-4 text-emerald-400" />
                                            <span>{selectedCategory.label}</span>
                                        </div>
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                                {EXPENSE_CATEGORIES.map((cat) => {
                                    const Icon = getCategoryIcon(cat.id);
                                    return (
                                        <SelectItem
                                            key={cat.id}
                                            value={cat.id}
                                            className="focus:bg-emerald-500/20 focus:text-white"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4 text-gray-400" />
                                                <span>{cat.label}</span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Name + Amount Row */}
                    <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-3">
                            <Label htmlFor="name" className="text-gray-400 text-xs font-medium mb-1.5 block">Goal Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., New Car"
                                autoFocus
                                className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 focus:border-white/30"
                            />
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="target" className="text-gray-400 text-xs font-medium mb-1.5 block">Target</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-emerald-400">$</span>
                                <Input
                                    id="target"
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 pl-7 focus:border-white/30 text-base font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Target Date */}
                    <div>
                        <Label htmlFor="targetDate" className="text-gray-400 text-xs font-medium mb-1.5 block">Target Date (Optional)</Label>
                        <Input
                            id="targetDate"
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                            className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 focus:border-white/30 cursor-pointer text-sm"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <Label htmlFor="description" className="text-gray-400 text-xs font-medium mb-1.5 block">Notes (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Why are you saving for this goal?"
                            rows={2}
                            className="bg-zinc-800/50 border-zinc-700/50 rounded-lg focus:border-white/30 resize-none"
                        />
                    </div>

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
                            className="h-9 px-5 font-semibold rounded-lg gap-2 bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/25 text-white transition-all hover:opacity-90 active:scale-[0.98]"
                        >
                            {submitText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

