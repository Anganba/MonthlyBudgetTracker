import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useWallets } from "@/hooks/use-wallets";
import { useBudget } from "@/hooks/use-budget";
import { Button } from "@/components/ui/button";
import { Plus, Wallet as WalletIcon, Smartphone, Landmark, CreditCard, Banknote, MoreVertical, Pencil, Trash2, Globe, Sparkles, TrendingUp, ArrowRightLeft, ArrowRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Wallet } from "@shared/api";
import { useTransactions } from "@/hooks/use-transactions";
import { Link } from "react-router-dom";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const getWalletIcon = (type: string) => {
    switch (type) {
        case 'mfs': return Smartphone;
        case 'bank': return Landmark;
        case 'credit_card': return CreditCard;
        case 'debit_card': return CreditCard;
        case 'virtual_card': return Globe;
        case 'cash': return Banknote;
        default: return WalletIcon;
    }
};

const getWalletGradient = (type: string) => {
    switch (type) {
        case 'mfs': return 'from-pink-500/20 to-pink-500/5 border-pink-500/30 hover:border-pink-500/50';
        case 'bank': return 'from-blue-500/20 to-blue-500/5 border-blue-500/30 hover:border-blue-500/50';
        case 'credit_card': return 'from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/50';
        case 'debit_card': return 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:border-cyan-500/50';
        case 'virtual_card': return 'from-orange-500/20 to-orange-500/5 border-orange-500/30 hover:border-orange-500/50';
        case 'cash': return 'from-green-500/20 to-green-500/5 border-green-500/30 hover:border-green-500/50';
        default: return 'from-gray-500/20 to-gray-500/5 border-gray-500/30 hover:border-gray-500/50';
    }
};

const getWalletIconColor = (type: string) => {
    switch (type) {
        case 'mfs': return 'text-pink-400 bg-pink-500/20';
        case 'bank': return 'text-blue-400 bg-blue-500/20';
        case 'credit_card': return 'text-purple-400 bg-purple-500/20';
        case 'debit_card': return 'text-cyan-400 bg-cyan-500/20';
        case 'virtual_card': return 'text-orange-400 bg-orange-500/20';
        case 'cash': return 'text-green-400 bg-green-500/20';
        default: return 'text-gray-400 bg-gray-500/20';
    }
};

const getWalletBarColor = (type: string) => {
    switch (type) {
        case 'mfs': return 'bg-pink-500';
        case 'bank': return 'bg-blue-500';
        case 'credit_card': return 'bg-purple-500';
        case 'debit_card': return 'bg-cyan-500';
        case 'virtual_card': return 'bg-orange-500';
        case 'cash': return 'bg-green-500';
        default: return 'bg-gray-500';
    }
};

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

interface SortableWalletCardProps {
    wallet: Wallet;
    recentTransactions: any[];
    onEdit: (wallet: Wallet) => void;
    onTransfer: (walletId: string) => void;
    onDelete: (wallet: Wallet) => void;
}

const SortableWalletCard = ({ wallet, recentTransactions, onEdit, onTransfer, onDelete }: SortableWalletCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: wallet.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" as "relative" : "relative" as "relative",
    };

    const Icon = getWalletIcon(wallet.type);
    const gradientClass = getWalletGradient(wallet.type);
    const iconColorClass = getWalletIconColor(wallet.type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`group relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br ${gradientClass} border p-4 md:p-5 transition-all hover:scale-[1.02] hover:shadow-xl ${isDragging ? 'shadow-2xl scale-105 opacity-80' : ''}`}
        >
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div
                        className="flex items-center gap-2 md:gap-3 cursor-grab active:cursor-grabbing"
                        {...listeners}
                    >
                        <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl ${iconColorClass}`}>
                            <Icon className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white text-base md:text-lg">{wallet.name}</h3>
                                {wallet.isSavingsWallet && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-md font-medium">
                                        Savings
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] md:text-xs text-gray-400">{getWalletLabel(wallet.type)}</p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10">
                            <DropdownMenuItem onClick={() => onTransfer(wallet.id)} className="hover:bg-white/10">
                                <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => onEdit(wallet)} className="hover:bg-white/10">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 hover:text-red-400" onClick={() => onDelete(wallet)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mb-2 cursor-grab active:cursor-grabbing" {...listeners}>
                    <p className="text-2xl md:text-3xl font-bold text-white">${wallet.balance.toLocaleString()}</p>
                    <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 md:mt-1">Available Balance</p>
                </div>

                {/* Recent Transactions & Description Section */}
                {(recentTransactions.length > 0 || wallet.description) && (
                    <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
                        <div className={`grid gap-3 ${wallet.description && recentTransactions.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {/* Recent Activity - Left Side */}
                            {recentTransactions.length > 0 && (
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Recent Activity</p>
                                    <div className="space-y-1.5">
                                        {recentTransactions.slice(0, 2).map(t => {
                                            const isIncoming =
                                                t.type === 'income' ||
                                                t.toWalletId === wallet.id;
                                            const isOutgoing =
                                                t.type === 'expense' ||
                                                (t.type === 'transfer' && t.walletId === wallet.id) ||
                                                (t.type === 'savings' && t.walletId === wallet.id);

                                            return (
                                                <div key={t.id} className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400 truncate flex-1 mr-2">{t.name}</span>
                                                    <span className={`text-xs font-medium ${isOutgoing ? 'text-orange-400' : 'text-green-400'}`}>
                                                        {isOutgoing ? '-' : '+'}${t.actual.toLocaleString()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Link to={`/transactions?wallet=${wallet.id}`} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-primary mt-2 transition-colors">
                                        View all <ArrowRight className="h-2.5 w-2.5" />
                                    </Link>
                                </div>
                            )}

                            {/* Description/Notes - Right Side */}
                            {wallet.description && (
                                <div className={recentTransactions.length > 0 ? 'border-l border-white/10 pl-3' : ''}>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                                    <p className="text-xs text-gray-400 italic line-clamp-3">{wallet.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function WalletsPage() {
    const { wallets, createWallet, updateWallet, deleteWallet, reorderWallets } = useWallets();
    const { createTransaction } = useTransactions();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);
    const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

    // DnD State
    const [items, setItems] = useState<Wallet[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (wallets.length > 0) {
            // Apply consistent sorting logic matching AccountsSection
            const sortedWallets = [...wallets].sort((a, b) => {
                const orderA = a.order !== undefined ? a.order : 9999;
                const orderB = b.order !== undefined ? b.order : 9999;

                if (orderA !== orderB) return orderA - orderB;

                // Fallback: sort by createdAt desc if order is same (both missing/9999)
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            });
            setItems(sortedWallets);
        }
    }, [wallets]);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Trigger mutation
                reorderWallets.mutate(newItems.map(w => w.id));

                return newItems;
            });
        }
    };
    const [formData, setFormData] = useState({
        name: "",
        type: "mfs",
        balance: "",
        description: "",
        color: "#ffffff",
        isSavingsWallet: false
    });
    const [transferData, setTransferData] = useState({
        fromWalletId: "",
        toWalletId: "",
        amount: ""
    });
    const [showAllDistribution, setShowAllDistribution] = useState(false);

    // Get current month's budget for recent transactions
    const currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const { budget } = useBudget(monthNames[currentDate.getMonth()], currentDate.getFullYear());
    const allTransactions = budget?.transactions || [];

    // Get recent transactions for a specific wallet
    const getWalletTransactions = (walletId: string) => {
        return allTransactions
            .filter(t => {
                // Primary wallet match
                if (t.walletId === walletId) return true;
                // For transfers only, also check destination wallet
                if (t.type === 'transfer' && t.toWalletId === walletId) return true;
                return false;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);
    };

    const handleOpen = (wallet?: Wallet, defaultType?: string) => {
        if (wallet) {
            // Show confirmation dialog first when editing
            setWalletToEdit(wallet);
            setIsConfirmOpen(true);
        } else {
            // Direct open for creating new wallet
            setEditingWallet(null);
            setFormData({
                name: "",
                type: defaultType || "mfs",
                balance: "0",
                description: "",
                color: "#ffffff",
                isSavingsWallet: false
            });
            setIsDialogOpen(true);
        }
    };

    const handleConfirmEdit = () => {
        if (walletToEdit) {
            setEditingWallet(walletToEdit);
            setFormData({
                name: walletToEdit.name,
                type: walletToEdit.type,
                balance: walletToEdit.balance.toString(),
                description: walletToEdit.description || "",
                color: walletToEdit.color || "#ffffff",
                isSavingsWallet: walletToEdit.isSavingsWallet || false
            });
            setIsConfirmOpen(false);
            setIsDialogOpen(true);
        }
    };

    const handleOpenTransfer = (fromWalletId?: string) => {
        setTransferData({
            fromWalletId: fromWalletId || (wallets[0]?.id || ""),
            toWalletId: wallets[1]?.id || "",
            amount: ""
        });
        setIsTransferOpen(true);
    };

    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            name: formData.name,
            type: formData.type as any,
            balance: parseFloat(formData.balance) || 0,
            description: formData.description,
            color: formData.color,
            isSavingsWallet: formData.isSavingsWallet
        };

        if (editingWallet) {
            // Check for no changes
            const noChanges =
                formData.name === editingWallet.name &&
                formData.type === editingWallet.type &&
                (parseFloat(formData.balance) || 0) === editingWallet.balance &&
                formData.description === (editingWallet.description || '') &&
                formData.color === editingWallet.color &&
                formData.isSavingsWallet === (editingWallet.isSavingsWallet || false);

            if (noChanges) {
                toast({
                    title: "No Changes",
                    description: "No changes were made to this wallet.",
                });
                setTimeout(() => setIsDialogOpen(false), 100);
                return;
            }
            updateWallet.mutate({ id: editingWallet.id, ...data });
        } else {
            createWallet.mutate(data);
        }
        setIsDialogOpen(false);
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(transferData.amount);
        if (!amount || amount <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter an amount greater than 0.",
                variant: "destructive"
            });
            return;
        }

        const fromWallet = wallets.find(w => w.id === transferData.fromWalletId);
        const toWallet = wallets.find(w => w.id === transferData.toWalletId);
        if (!fromWallet || !toWallet) return;

        createTransaction({
            name: `Transfer: ${fromWallet.name} → ${toWallet.name}`,
            category: 'Transfer',
            type: 'transfer',
            planned: amount,
            actual: amount,
            date: new Date().toISOString().split('T')[0],
            walletId: transferData.fromWalletId,
            toWalletId: transferData.toWalletId
        });

        setIsTransferOpen(false);
    };

    const handleDelete = (wallet: Wallet) => {
        setWalletToDelete(wallet);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (walletToDelete) {
            deleteWallet.mutate(walletToDelete.id);
        }
        setIsDeleteConfirmOpen(false);
        setWalletToDelete(null);
    };

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    return (
        <div className="min-h-screen bg-background text-white p-4 md:p-6 lg:p-8 relative overflow-hidden">
            {/* Background decorations - hidden on mobile */}
            <div className="hidden md:block absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="hidden md:block absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6 relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-white">My Wallets</h1>
                        <p className="text-gray-500 text-sm mt-0.5 md:mt-1 hidden sm:block">Manage your accounts and payment methods</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => handleOpenTransfer()}
                            variant="outline"
                            className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl md:rounded-2xl px-3 md:px-4 h-10 md:h-11 font-medium text-sm flex-1 sm:flex-none"
                        >
                            <ArrowRightLeft className="mr-1.5 h-4 w-4" />
                            <span className="hidden sm:inline">Transfer</span>
                        </Button>
                        <Button
                            onClick={() => handleOpen()}
                            className="bg-primary text-black hover:bg-primary/90 rounded-xl md:rounded-2xl px-4 md:px-6 h-10 md:h-11 font-bold shadow-lg shadow-primary/20 text-sm flex-1 sm:flex-none"
                        >
                            <Plus className="mr-1.5 md:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Add Wallet</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                    {/* Net Worth Card */}
                    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-white/10 p-4 md:p-5">
                        <div className="hidden md:block absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
                        <div className="relative z-10 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/20 shadow-lg shadow-primary/10">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Total Net Worth</p>
                                    <p className="text-2xl md:text-3xl font-bold text-white">${totalBalance.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-medium text-primary">{wallets.length} Accounts</span>
                            </div>
                        </div>
                    </div>

                    {/* Distribution Card */}
                    <div className="lg:col-span-2 rounded-2xl md:rounded-3xl bg-zinc-900/50 border border-white/10 p-4 md:p-5">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Distribution</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                            {wallets
                                .sort((a, b) => b.balance - a.balance)
                                .slice(0, showAllDistribution ? wallets.length : 6)
                                .map(wallet => {
                                    const percent = totalBalance > 0 ? (wallet.balance / totalBalance) * 100 : 0;
                                    const barColor = getWalletBarColor(wallet.type);
                                    return (
                                        <div key={wallet.id} className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 w-20 truncate" title={wallet.name}>{wallet.name}</span>
                                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-500 w-10 text-right">{Math.round(percent)}%</span>
                                        </div>
                                    );
                                })}
                        </div>
                        {wallets.length > 6 && (
                            <button
                                onClick={() => setShowAllDistribution(!showAllDistribution)}
                                className="w-full text-[10px] text-primary hover:text-primary/80 text-center py-1 mt-2 transition-colors cursor-pointer"
                            >
                                {showAllDistribution ? 'Show less' : `+${wallets.length - 6} more`}
                            </button>
                        )}
                    </div>
                </div>

                {/* Empty State */}
                {wallets.length === 0 && (
                    <div className="text-center py-12 md:py-16">
                        <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                            <WalletIcon className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No wallets yet</h3>
                        <p className="text-gray-400 mb-4 max-w-md mx-auto">Get started by adding your first wallet. Track your cash, bank accounts, mobile payments, and more.</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button onClick={() => handleOpen(undefined, 'cash')} variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                                <Banknote className="mr-2 h-4 w-4" /> Add Cash
                            </Button>
                            <Button onClick={() => handleOpen(undefined, 'bank')} variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                                <Landmark className="mr-2 h-4 w-4" /> Add Bank
                            </Button>
                            <Button onClick={() => handleOpen(undefined, 'mfs')} variant="outline" className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10">
                                <Smartphone className="mr-2 h-4 w-4" /> Add MFS
                            </Button>
                        </div>
                    </div>
                )}

                {/* Wallet Cards Grid */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={items.map(w => w.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {items.map((wallet) => (
                                <SortableWalletCard
                                    key={wallet.id}
                                    wallet={wallet}
                                    recentTransactions={getWalletTransactions(wallet.id)}
                                    onEdit={handleOpen}
                                    onTransfer={handleOpenTransfer}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </SortableContext>
                    {/* Drag Overlay for smooth preview */}
                    {/* We can implement DragOverlay if needed for better visuals, but basic sorting works without it if opaque.
                        For a polished look, DragOverlay is recommended. */}
                </DndContext>
            </div>


            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[420px] bg-zinc-900/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden shadow-2xl shadow-black/50">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-b from-blue-500/20 via-cyan-500/10 to-transparent p-4 pb-3">
                        <DialogHeader className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                    <WalletIcon className="h-4 w-4 text-blue-400" />
                                </div>
                                <DialogTitle className="text-base font-semibold text-white">
                                    {editingWallet ? "Edit Wallet" : "Add New Wallet"}
                                </DialogTitle>
                            </div>
                            <DialogDescription className="sr-only">
                                {editingWallet ? "Update your wallet details" : "Add a new wallet to track your funds"}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit} className="p-4 pt-3 space-y-3">
                        {/* Name */}
                        <div>
                            <Label htmlFor="name" className="text-gray-400 text-xs font-medium mb-1.5 block">Wallet Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Bkash, City Bank"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                autoFocus
                                className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 focus:border-white/30"
                            />
                        </div>

                        {/* Type + Balance Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="type" className="text-gray-400 text-xs font-medium mb-1.5 block">Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                                >
                                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        <SelectItem value="mfs">MFS (Bkash, Nagad)</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank">Bank Account</SelectItem>
                                        <SelectItem value="credit_card">Credit Card</SelectItem>
                                        <SelectItem value="debit_card">Debit Card</SelectItem>
                                        <SelectItem value="virtual_card">Virtual Card</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="balance" className="text-gray-400 text-xs font-medium mb-1.5 block">Balance</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-400">$</span>
                                    <Input
                                        id="balance"
                                        type="number"
                                        step="0.01"
                                        value={formData.balance}
                                        onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                        required
                                        className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 pl-7 focus:border-white/30 text-base font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <Label htmlFor="description" className="text-gray-400 text-xs font-medium mb-1.5 block">Notes (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="e.g. Main savings account"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[60px] resize-y bg-zinc-800/50 border-zinc-700/50 rounded-lg focus:border-white/30"
                            />
                        </div>

                        {/* Savings Wallet Toggle */}
                        {(() => {
                            const existingSavingsWallet = wallets.find(w => w.isSavingsWallet === true);
                            const isCurrentWalletSavings = editingWallet && existingSavingsWallet && editingWallet.id === existingSavingsWallet.id;
                            const canToggle = !existingSavingsWallet || isCurrentWalletSavings;

                            return (
                                <div className={`p-3 rounded-xl border ${canToggle ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="isSavingsWallet"
                                            checked={formData.isSavingsWallet}
                                            onChange={(e) => setFormData({ ...formData, isSavingsWallet: e.target.checked })}
                                            disabled={!canToggle}
                                            className="mt-0.5 w-4 h-4 accent-emerald-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <div className="flex-1">
                                            <Label
                                                htmlFor="isSavingsWallet"
                                                className={`text-xs font-medium ${canToggle ? 'text-emerald-400 cursor-pointer' : 'text-gray-500 cursor-not-allowed'}`}
                                            >
                                                Use as Savings Wallet for Goals
                                            </Label>
                                            {!canToggle && (
                                                <p className="text-[10px] text-amber-400 mt-1">
                                                    ⚠️ "{existingSavingsWallet?.name}" is already the savings wallet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Footer */}
                        <DialogFooter className="pt-2 gap-2 sm:gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="text-gray-400 hover:text-white hover:bg-white/5 h-9 px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="h-9 px-5 font-semibold rounded-lg gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25 text-white transition-all hover:opacity-90 active:scale-[0.98]"
                            >
                                {editingWallet ? "Update Wallet" : "Create Wallet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Quick Transfer Dialog */}
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogContent className="sm:max-w-[400px] bg-zinc-900/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden shadow-2xl shadow-black/50">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-b from-purple-500/20 via-violet-500/10 to-transparent p-4 pb-3">
                        <DialogHeader className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
                                    <ArrowRightLeft className="h-4 w-4 text-purple-400" />
                                </div>
                                <DialogTitle className="text-base font-semibold text-white">Quick Transfer</DialogTitle>
                            </div>
                            <DialogDescription className="sr-only">
                                Move funds between your wallets
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleTransfer} className="p-4 pt-3 space-y-3">
                        <div className="flex flex-col">
                            {/* From Wallet */}
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">From</Label>
                                <Select
                                    value={transferData.fromWalletId}
                                    onValueChange={(v) => setTransferData({ ...transferData, fromWalletId: v })}
                                >
                                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10">
                                        <SelectValue placeholder="Select wallet" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id} disabled={w.id === transferData.toWalletId}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{w.name}</span>
                                                    <span className="text-gray-500 ml-2">${w.balance.toLocaleString()}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Swap Button - Static Flow with Spacing */}
                            <div className="flex justify-center my-2">
                                <button
                                    type="button"
                                    onClick={() => setTransferData({
                                        ...transferData,
                                        fromWalletId: transferData.toWalletId,
                                        toWalletId: transferData.fromWalletId
                                    })}
                                    className="p-2 rounded-full bg-zinc-900 border border-purple-500/30 hover:border-purple-500/60 shadow-lg shadow-black/50 transition-all cursor-pointer active:scale-95 group translate-y-3"
                                    title="Swap wallets"
                                >
                                    <ArrowRightLeft className="h-4 w-4 text-purple-400 rotate-90 group-hover:text-purple-300" />
                                </button>
                            </div>

                            {/* To Wallet */}
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">To</Label>
                                <Select
                                    value={transferData.toWalletId}
                                    onValueChange={(v) => setTransferData({ ...transferData, toWalletId: v })}
                                >
                                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10">
                                        <SelectValue placeholder="Select wallet" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id} disabled={w.id === transferData.fromWalletId}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{w.name}</span>
                                                    <span className="text-gray-500 ml-2">${w.balance.toLocaleString()}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-purple-400">$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    value={transferData.amount}
                                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                                    required
                                    className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 pl-7 focus:border-white/30 text-base font-medium"
                                />
                            </div>
                            {transferData.fromWalletId && (
                                <p className="text-[10px] text-gray-500 mt-1.5">
                                    Available: ${wallets.find(w => w.id === transferData.fromWalletId)?.balance.toLocaleString() || 0}
                                </p>
                            )}
                        </div>

                        {/* Insufficient balance warning */}
                        {(() => {
                            const fromWallet = wallets.find(w => w.id === transferData.fromWalletId);
                            const amount = parseFloat(transferData.amount) || 0;
                            if (fromWallet && (fromWallet.balance === 0 || (amount > 0 && fromWallet.balance < amount))) {
                                return (
                                    <p className="text-[10px] text-amber-400 flex items-center gap-1">
                                        ⚠️ Insufficient balance in source wallet
                                    </p>
                                );
                            }
                            return null;
                        })()}

                        {/* Footer */}
                        <DialogFooter className="pt-2 gap-2 sm:gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsTransferOpen(false)}
                                className="text-gray-400 hover:text-white hover:bg-white/5 h-9 px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    !transferData.fromWalletId ||
                                    !transferData.toWalletId ||
                                    transferData.fromWalletId === transferData.toWalletId ||
                                    (wallets.find(w => w.id === transferData.fromWalletId)?.balance || 0) < (parseFloat(transferData.amount) || 0)
                                }
                                className="h-9 px-5 font-semibold rounded-lg gap-2 bg-gradient-to-r from-purple-500 to-violet-500 shadow-lg shadow-purple-500/25 text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                            >
                                Transfer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for Edit */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="bg-zinc-900 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-serif text-white">Edit Wallet?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            {walletToEdit && (
                                <>
                                    You are about to edit <span className="text-white font-semibold">{walletToEdit.name}</span> with a current balance of <span className="text-primary font-semibold">${walletToEdit.balance.toLocaleString()}</span>.
                                    <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                        <p className="text-xs text-yellow-400/90">
                                            ⚠️ Changing the balance will be tracked in the audit log. Make sure any changes reflect your actual wallet balance.
                                        </p>
                                    </div>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmEdit}
                            className="bg-primary text-black hover:bg-primary/90 font-bold"
                        >
                            Continue to Edit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent className="bg-zinc-900 border-red-500/20">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-serif text-white flex items-center gap-2">
                            <Trash2 className="h-6 w-6 text-red-400" />
                            Delete Wallet?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            {walletToDelete && (
                                <>
                                    You are about to delete <span className="text-white font-semibold">{walletToDelete.name}</span> with a balance of <span className="text-primary font-semibold">${walletToDelete.balance.toLocaleString()}</span>.
                                    <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <p className="text-xs text-red-400/90">
                                            ⚠️ This action cannot be undone. Transactions linked to this wallet may show incorrect data after deletion.
                                        </p>
                                    </div>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-500 text-white hover:bg-red-600 font-bold"
                        >
                            Delete Wallet
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
