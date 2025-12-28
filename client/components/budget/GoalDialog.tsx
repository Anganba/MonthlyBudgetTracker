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
import { Textarea } from '@/components/ui/textarea';
import { Goal, GoalCategory } from '@shared/api';
import {
    Target, Car, Plane, Home, Laptop, GraduationCap,
    Gem, Shield, Smartphone, Gift
} from 'lucide-react';

// Goal category configuration with icons and colors
export const GOAL_CATEGORIES: { id: GoalCategory; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'car', label: 'Car / Vehicle', icon: Car, color: 'text-blue-400 bg-blue-500/20' },
    { id: 'travel', label: 'Travel / Holiday', icon: Plane, color: 'text-cyan-400 bg-cyan-500/20' },
    { id: 'home', label: 'Home / Property', icon: Home, color: 'text-amber-400 bg-amber-500/20' },
    { id: 'electronics', label: 'Electronics', icon: Laptop, color: 'text-purple-400 bg-purple-500/20' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: 'text-green-400 bg-green-500/20' },
    { id: 'wedding', label: 'Wedding / Event', icon: Gem, color: 'text-pink-400 bg-pink-500/20' },
    { id: 'emergency', label: 'Emergency Fund', icon: Shield, color: 'text-red-400 bg-red-500/20' },
    { id: 'gadget', label: 'Phone / Gadget', icon: Smartphone, color: 'text-indigo-400 bg-indigo-500/20' },
    { id: 'other', label: 'Other', icon: Gift, color: 'text-gray-400 bg-gray-500/20' },
];

export function getCategoryConfig(categoryId?: GoalCategory) {
    return GOAL_CATEGORIES.find(c => c.id === categoryId) || GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1];
}

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
    const [targetDate, setTargetDate] = useState('');
    const [category, setCategory] = useState<GoalCategory>('other');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (open && initialData) {
            setName(initialData.name || '');
            setTargetAmount(initialData.targetAmount?.toString() || '');
            setCurrentAmount(initialData.currentAmount?.toString() || '');
            setTargetDate(initialData.targetDate?.split('T')[0] || '');
            setCategory(initialData.category || 'other');
            setDescription(initialData.description || '');
        } else if (open && mode === 'add') {
            setName('');
            setTargetAmount('');
            setCurrentAmount('');
            setTargetDate('');
            setCategory('other');
            setDescription('');
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
                targetDate: targetDate || undefined,
                category,
                description: description || undefined,
                startedAt: initialData?.startedAt || new Date().toISOString(),
            });
            onOpenChange(false);
        }
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
                    {/* Category Selection */}
                    <div className="space-y-2">
                        <Label className="text-gray-400">Category</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {GOAL_CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = category === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${isSelected
                                                ? `${cat.color.split(' ')[1]} border-white/30`
                                                : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                                            }`}
                                    >
                                        <Icon className={`h-5 w-5 ${isSelected ? cat.color.split(' ')[0] : 'text-gray-400'}`} />
                                        <span className={`text-[10px] text-center ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                            {cat.label.split(' ')[0]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
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
