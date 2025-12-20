import { useState } from "react";
import { useWallets } from "@/hooks/use-wallets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet as WalletIcon, Smartphone, Landmark, CreditCard, Banknote, MoreVertical, Pencil, Trash2, Globe } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

const getWalletColor = (type: string) => {
    switch (type) {
        case 'mfs': return 'text-pink-500 bg-pink-500/10'; // Bkash color-ish
        case 'bank': return 'text-blue-500 bg-blue-500/10';
        case 'credit_card': return 'text-purple-500 bg-purple-500/10';
        case 'debit_card': return 'text-cyan-500 bg-cyan-500/10';
        case 'virtual_card': return 'text-orange-500 bg-orange-500/10';
        case 'cash': return 'text-green-500 bg-green-500/10';
        default: return 'text-gray-500 bg-gray-500/10';
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
        color: "#ffffff"
    });

    const handleOpen = (wallet?: Wallet) => {
        if (wallet) {
            setEditingWallet(wallet);
            setFormData({
                name: wallet.name,
                type: wallet.type,
                balance: wallet.balance.toString(),
                color: wallet.color || "#ffffff"
            });
        } else {
            setEditingWallet(null);
            setFormData({
                name: "",
                type: "mfs",
                balance: "0",
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
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto mb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">My Wallets</h1>
                    <p className="text-muted-foreground mt-1">Manage your accounts and MFS wallets.</p>
                </div>
                <Button onClick={() => handleOpen()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Add Wallet
                </Button>
            </div>

            {/* Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Net Worth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">${totalBalance.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wallets.map((wallet) => {
                    const Icon = getWalletIcon(wallet.type);
                    const colorClass = getWalletColor(wallet.type);

                    return (
                        <Card key={wallet.id} className="group hover:border-primary/50 transition-colors bg-card border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${colorClass}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-white">{wallet.name}</CardTitle>
                                        <CardDescription>{getWalletLabel(wallet.type)}</CardDescription>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpen(wallet)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(wallet.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">${wallet.balance.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Available Balance</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">{editingWallet ? "Edit Wallet" : "Add New Wallet"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Wallet Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Bkash, City Bank"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => setFormData({ ...formData, type: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
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
                            <Label htmlFor="balance">Current Balance</Label>
                            <Input
                                id="balance"
                                type="number"
                                step="0.01"
                                value={formData.balance}
                                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                required
                            />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{editingWallet ? "Update" : "Create"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
