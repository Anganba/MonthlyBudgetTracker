import { useState } from "react";
import { useWallets } from "@/hooks/use-wallets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet as WalletIcon, Smartphone, Landmark, CreditCard, Banknote, MoreVertical, Pencil, Trash2, Globe, Sparkles, TrendingUp } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
import { Wallet } from "@shared/api";

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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        type: "mfs",
        balance: "",
        description: "",
        color: "#ffffff"
    });

    const handleOpen = (wallet?: Wallet) => {
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
                type: "mfs",
                balance: "0",
                description: "",
                color: "#ffffff"
            });
        }
        setIsDialogOpen(true);
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

            <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-white">My Wallets</h1>
                        <p className="text-gray-500 text-sm mt-0.5 md:mt-1 hidden sm:block">Manage your accounts and payment methods</p>
                    </div>
                    <Button
                        onClick={() => handleOpen()}
                        className="bg-primary text-black hover:bg-primary/90 rounded-xl md:rounded-2xl px-4 md:px-6 h-10 md:h-11 font-bold shadow-lg shadow-primary/20 text-sm w-full sm:w-auto"
                    >
                        <Plus className="mr-1.5 md:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Add Wallet</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                </div>

                {/* Net Worth Card */}
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-white/10 p-4 md:p-8">
                    <div className="hidden md:block absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-2.5 md:p-4 rounded-xl md:rounded-2xl bg-primary/20 shadow-lg shadow-primary/10">
                                <TrendingUp className="h-5 w-5 md:h-8 md:w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm text-gray-400 uppercase tracking-wider">Total Net Worth</p>
                                <p className="text-2xl md:text-4xl font-bold text-white">${totalBalance.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20">
                            <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                            <span className="text-xs md:text-sm font-medium text-primary">{wallets.length} {wallets.length === 1 ? 'Account' : 'Accounts'}</span>
                        </div>
                    </div>
                </div>

                {/* Wallet Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                    {wallets.map((wallet) => {
                        const Icon = getWalletIcon(wallet.type);
                        const gradientClass = getWalletGradient(wallet.type);
                        const iconColorClass = getWalletIconColor(wallet.type);

                        return (
                            <div
                                key={wallet.id}
                                className={`group relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br ${gradientClass} border p-4 md:p-6 transition-all hover:scale-[1.02] hover:shadow-xl`}
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

                                    {wallet.description && (
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
                    <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-300">Wallet Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Bkash, City Bank"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-gray-300">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => setFormData({ ...formData, type: v })}
                            >
                                <SelectTrigger className="h-12 bg-zinc-800 border-zinc-700 focus:border-primary">
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
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-gray-300">Notes (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="e.g. Main savings account, Emergency fund&#10;Use Shift+Enter for new lines"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[80px] resize-y bg-zinc-800 border-zinc-700 focus:border-primary"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-primary text-black hover:bg-primary/90 font-bold">{editingWallet ? "Update" : "Create"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
