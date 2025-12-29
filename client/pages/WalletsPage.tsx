import { useState } from "react";
import { useWallets } from "@/hooks/use-wallets";
import { useBudget } from "@/hooks/use-budget";
import { Button } from "@/components/ui/button";
import { Plus, Wallet as WalletIcon, Smartphone, Landmark, CreditCard, Banknote, MoreVertical, Pencil, Trash2, Globe, Sparkles, TrendingUp, ArrowRightLeft, ArrowRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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

export default function WalletsPage() {
    const { wallets, createWallet, updateWallet, deleteWallet } = useWallets();
    const { createTransaction } = useTransactions();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        type: "mfs",
        balance: "",
        description: "",
        color: "#ffffff"
    });
    const [transferData, setTransferData] = useState({
        fromWalletId: "",
        toWalletId: "",
        amount: ""
    });

    // Get current month's budget for recent transactions
    const currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const { budget } = useBudget(monthNames[currentDate.getMonth()], currentDate.getFullYear());
    const allTransactions = budget?.transactions || [];

    // Get recent transactions for a specific wallet
    const getWalletTransactions = (walletId: string) => {
        return allTransactions
            .filter(t => t.walletId === walletId || t.toWalletId === walletId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);
    };

    const handleOpen = (wallet?: Wallet, defaultType?: string) => {
        if (wallet) {
            setEditingWallet(wallet);
            setFormData({
                name: wallet.name,
                type: wallet.type,
                balance: wallet.balance.toString(),
                description: wallet.description || "",
                color: wallet.color || "#ffffff"
            });
        } else {
            setEditingWallet(null);
            setFormData({
                name: "",
                type: defaultType || "mfs",
                balance: "0",
                description: "",
                color: "#ffffff"
            });
        }
        setIsDialogOpen(true);
    };

    const handleOpenTransfer = (fromWalletId?: string) => {
        setTransferData({
            fromWalletId: fromWalletId || (wallets[0]?.id || ""),
            toWalletId: wallets[1]?.id || "",
            amount: ""
        });
        setIsTransferOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            name: formData.name,
            type: formData.type as any,
            balance: parseFloat(formData.balance) || 0,
            description: formData.description,
            color: formData.color
        };

        if (editingWallet) {
            updateWallet.mutate({ id: editingWallet.id, ...data });
        } else {
            createWallet.mutate(data);
        }
        setIsDialogOpen(false);
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(transferData.amount);
        if (!amount || amount <= 0) return;

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

    const handleDelete = (id: string) => {
        if (confirm("Are you sure? Transactions linked to this wallet might show incorrect data.")) {
            deleteWallet.mutate(id);
        }
    };

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8 relative overflow-hidden">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
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
                    <div className="rounded-2xl md:rounded-3xl bg-zinc-900/50 border border-white/10 p-4 md:p-5">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Distribution</p>
                        <div className="space-y-2">
                            {wallets
                                .sort((a, b) => b.balance - a.balance)
                                .slice(0, 4)
                                .map(wallet => {
                                    const percent = totalBalance > 0 ? (wallet.balance / totalBalance) * 100 : 0;
                                    const barColor = getWalletBarColor(wallet.type);
                                    return (
                                        <div key={wallet.id} className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 w-24 truncate" title={wallet.name}>{wallet.name}</span>
                                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-500 w-10 text-right">{Math.round(percent)}%</span>
                                        </div>
                                    );
                                })}
                            {wallets.length > 4 && (
                                <p className="text-[10px] text-gray-500 text-center">+{wallets.length - 4} more</p>
                            )}
                        </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {wallets.map((wallet) => {
                        const Icon = getWalletIcon(wallet.type);
                        const gradientClass = getWalletGradient(wallet.type);
                        const iconColorClass = getWalletIconColor(wallet.type);
                        const recentTransactions = getWalletTransactions(wallet.id);

                        return (
                            <div
                                key={wallet.id}
                                className={`group relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br ${gradientClass} border p-4 md:p-5 transition-all hover:scale-[1.02] hover:shadow-xl`}
                            >
                                {/* Background glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-3 md:mb-4">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl ${iconColorClass}`}>
                                                <Icon className="h-4 w-4 md:h-5 md:w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white text-base md:text-lg">{wallet.name}</h3>
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
                                                <DropdownMenuItem onClick={() => handleOpenTransfer(wallet.id)} className="hover:bg-white/10">
                                                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-white/10" />
                                                <DropdownMenuItem onClick={() => handleOpen(wallet)} className="hover:bg-white/10">
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleDelete(wallet.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="mb-2">
                                        <p className="text-2xl md:text-3xl font-bold text-white">${wallet.balance.toLocaleString()}</p>
                                        <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 md:mt-1">Available Balance</p>
                                    </div>

                                    {/* Recent Transactions */}
                                    {recentTransactions.length > 0 && (
                                        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Recent Activity</p>
                                            <div className="space-y-1.5">
                                                {recentTransactions.slice(0, 2).map(t => {
                                                    const isIncoming = t.toWalletId === wallet.id;
                                                    return (
                                                        <div key={t.id} className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-400 truncate flex-1 mr-2">{t.name}</span>
                                                            <span className={`text-xs font-medium ${isIncoming ? 'text-green-400' : 'text-red-400'}`}>
                                                                {isIncoming ? '+' : '-'}${t.actual.toLocaleString()}
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

                                    {wallet.description && !recentTransactions.length && (
                                        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
                                            <p className="text-xs md:text-sm text-gray-400 italic line-clamp-2">{wallet.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">{editingWallet ? "Edit Wallet" : "Add New Wallet"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-300">Wallet Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Bkash, City Bank"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="h-11 bg-zinc-800 border-zinc-700 focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-gray-300">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => setFormData({ ...formData, type: v })}
                            >
                                <SelectTrigger className="h-11 bg-zinc-800 border-zinc-700 focus:border-primary">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="mfs">MFS (Bkash, Nagad)</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank">Bank Account</SelectItem>
                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                    <SelectItem value="debit_card">Debit Card</SelectItem>
                                    <SelectItem value="virtual_card">Virtual Card (RedotPay, PayPal)</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="balance" className="text-gray-300">Current Balance</Label>
                            <Input
                                id="balance"
                                type="number"
                                step="0.01"
                                value={formData.balance}
                                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                required
                                className="h-11 bg-zinc-800 border-zinc-700 focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-gray-300">Notes (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="e.g. Main savings account"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[60px] resize-y bg-zinc-800 border-zinc-700 focus:border-primary"
                            />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-primary text-black hover:bg-primary/90 font-bold">{editingWallet ? "Update" : "Create"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Quick Transfer Dialog */}
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogContent className="sm:max-w-[400px] bg-zinc-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-primary" />
                            Quick Transfer
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleTransfer} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">From</Label>
                            <Select
                                value={transferData.fromWalletId}
                                onValueChange={(v) => setTransferData({ ...transferData, fromWalletId: v })}
                            >
                                <SelectTrigger className="h-11 bg-zinc-800 border-zinc-700">
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
                        <div className="flex justify-center">
                            <div className="p-2 rounded-full bg-white/5">
                                <ArrowRightLeft className="h-4 w-4 text-gray-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">To</Label>
                            <Select
                                value={transferData.toWalletId}
                                onValueChange={(v) => setTransferData({ ...transferData, toWalletId: v })}
                            >
                                <SelectTrigger className="h-11 bg-zinc-800 border-zinc-700">
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
                        <div className="space-y-2">
                            <Label className="text-gray-300">Amount</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={transferData.amount}
                                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                                required
                                className="h-11 bg-zinc-800 border-zinc-700 focus:border-primary text-lg"
                            />
                            {transferData.fromWalletId && (
                                <p className="text-xs text-gray-500">
                                    Available: ${wallets.find(w => w.id === transferData.fromWalletId)?.balance.toLocaleString() || 0}
                                </p>
                            )}
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                className="bg-primary text-black hover:bg-primary/90 font-bold"
                                disabled={!transferData.fromWalletId || !transferData.toWalletId || !transferData.amount || transferData.fromWalletId === transferData.toWalletId}
                            >
                                Transfer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
