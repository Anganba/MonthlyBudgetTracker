import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Check, Tags } from "lucide-react";
import { useCategories, CustomCategory } from "@/hooks/use-categories";
import { ICON_PICKER_OPTIONS, getIconByName } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

export function CustomCategoriesSection() {
    const { customCategories, addCategory, removeCategory, isSaving } = useCategories();
    const { toast } = useToast();
    const [showAddCat, setShowAddCat] = useState(false);
    const [catName, setCatName] = useState('');
    const [catType, setCatType] = useState<'expense' | 'income'>('expense');
    const [catIcon, setCatIcon] = useState('CircleDollarSign');
    const [deleteConfirm, setDeleteConfirm] = useState<CustomCategory | null>(null);

    const handleAddCat = () => {
        if (!catName.trim()) return;
        const newCat: CustomCategory = {
            id: catName.trim(),
            label: catName.trim(),
            type: catType,
            icon: catIcon,
        };
        const success = addCategory(newCat);
        if (success) {
            setCatName('');
            setCatIcon('CircleDollarSign');
            setShowAddCat(false);
        }
    };

    const handleDeleteConfirmed = () => {
        if (!deleteConfirm) return;
        const catLabel = deleteConfirm.label;
        removeCategory(deleteConfirm.id);
        setDeleteConfirm(null);
        toast({
            title: "Category Deleted",
            description: `"${catLabel}" has been removed from your custom categories.`,
        });
    };

    return (
        <>
            <div className="rounded-2xl bg-gradient-to-br from-pink-500/10 via-zinc-900/80 to-zinc-900/50 border border-pink-500/30 p-6 shadow-lg shadow-pink-500/5">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/20 shadow-inner">
                            <Tags className="h-6 w-6 text-pink-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Custom Categories</h3>
                            <p className="text-sm text-pink-300/60">Add your own categories for transactions</p>
                        </div>
                    </div>
                    {!showAddCat && (
                        <Button
                            onClick={() => setShowAddCat(true)}
                            size="sm"
                            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:opacity-90 shadow-lg shadow-pink-500/20"
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            Add Category
                        </Button>
                    )}
                </div>

                {/* Add Category Form */}
                {showAddCat && (
                    <div className="mb-6 p-4 rounded-xl bg-zinc-800/80 border border-pink-500/20 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Name</Label>
                                <Input
                                    value={catName}
                                    onChange={(e) => setCatName(e.target.value)}
                                    placeholder="e.g. Laundry"
                                    autoFocus
                                    className="bg-zinc-900/50 border-zinc-700/50 rounded-lg h-10"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') { e.preventDefault(); handleAddCat(); }
                                        if (e.key === 'Escape') setShowAddCat(false);
                                    }}
                                />
                            </div>
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Type</Label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCatType('expense')}
                                        className={cn(
                                            "flex-1 h-10 rounded-lg text-sm font-medium transition-all border",
                                            catType === 'expense'
                                                ? "bg-red-500/20 border-red-500/50 text-red-400"
                                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                        )}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCatType('income')}
                                        className={cn(
                                            "flex-1 h-10 rounded-lg text-sm font-medium transition-all border",
                                            catType === 'income'
                                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                        )}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Icon Picker */}
                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Choose Icon</Label>
                            <div className="grid grid-cols-12 gap-1.5 max-h-[120px] overflow-y-auto p-2 rounded-lg bg-zinc-900/50 border border-zinc-700/30">
                                {ICON_PICKER_OPTIONS.map(({ name, icon: IconComp }) => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => setCatIcon(name)}
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            catIcon === name
                                                ? "bg-pink-500/30 border border-pink-500/50 text-pink-400 scale-110 shadow-lg shadow-pink-500/20"
                                                : "bg-white/5 border border-transparent text-gray-500 hover:text-white hover:bg-white/10"
                                        )}
                                        title={name}
                                    >
                                        <IconComp className="h-4 w-4" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => { setShowAddCat(false); setCatName(''); setCatIcon('CircleDollarSign'); }}
                                className="flex-1 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleAddCat}
                                disabled={!catName.trim() || isSaving}
                                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Create Category
                            </Button>
                        </div>
                    </div>
                )}

                {/* Category List */}
                {customCategories.length === 0 && !showAddCat && (
                    <div className="text-center py-8 text-gray-500">
                        <Tags className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No custom categories yet</p>
                        <p className="text-xs text-gray-600 mt-1">Add your own categories for better tracking</p>
                    </div>
                )}

                {customCategories.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {customCategories.map((cat) => {
                            const CatIcon = getIconByName(cat.icon || 'CircleDollarSign');
                            return (
                                <div
                                    key={cat.id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            cat.type === 'income'
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : "bg-pink-500/20 text-pink-400"
                                        )}>
                                            <CatIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white text-sm">{cat.label}</p>
                                            <p className={cn(
                                                "text-xs",
                                                cat.type === 'income' ? "text-emerald-400/60" : "text-pink-400/60"
                                            )}>
                                                {cat.type === 'income' ? 'Income' : 'Expense'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDeleteConfirm(cat)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                                        title="Delete category"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent className="bg-zinc-900 border-red-500/30">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-red-500/20">
                                <Trash2 className="h-5 w-5 text-red-400" />
                            </div>
                            Delete Category
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-white">"{deleteConfirm?.label}"</span>?
                            <br /><br />
                            <span className="text-amber-400">⚠️ Existing transactions using this category will not be affected.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-gray-300 hover:bg-zinc-700 hover:text-white">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={handleDeleteConfirmed}
                        >
                            Delete Category
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
