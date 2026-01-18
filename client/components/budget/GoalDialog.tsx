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
            <DialogContent className="sm:max-w-lg bg-zinc-900 border-white/10 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl text-white flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${selectedCategory.color.split(' ')[1]}`}>
                            <CategoryIcon className={`h-5 w-5 ${selectedCategory.color.split(' ')[0]}`} />
                        </div>
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        {description_text}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Category Selection - Dropdown */}
                    <div className="space-y-2">
                        <Label className="text-gray-400">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-11 bg-zinc-800 border-zinc-700 rounded-xl focus:border-primary">
                                <SelectValue placeholder="Select a category">
                                    {category && (
                                        <div className="flex items-center gap-2">
                                            <CategoryIcon className="h-4 w-4 text-primary" />
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
                                            className="focus:bg-primary/20 focus:text-white"
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

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-400">Goal Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., New Car, Holiday Trip"
                            autoFocus
                            className="bg-zinc-800 border-zinc-700 rounded-xl h-11 focus:border-primary"
                        />
                    </div>

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
                        <Label htmlFor="targetDate" className="text-gray-400">Target Date (Optional)</Label>
                        <Input
                            id="targetDate"
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 rounded-xl h-11 focus:border-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-400">Notes (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Why are you saving for this goal?"
                            rows={2}
                            className="bg-zinc-800 border-zinc-700 rounded-xl focus:border-primary resize-none"
                        />
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

