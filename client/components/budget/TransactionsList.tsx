import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SlidersHorizontal, Heart, ShoppingBag, Gamepad2, Home, Utensils, ArrowUpDown, Banknote, Car, Zap, Plane, GraduationCap, CircleDollarSign, PiggyBank, ArrowRightLeft, ArrowRight } from "lucide-react";
import { Transaction } from "@shared/api";
import { getCategoryIcon } from "@/lib/category-icons";
import { format } from "date-fns";
import { useState } from "react";

import { Wallet } from "@shared/api";

interface TransactionsListProps {
    transactions: Transaction[];
    wallets: Wallet[];
    currency: string;
}

export function TransactionsList({ transactions, wallets, currency }: TransactionsListProps) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | 'date' | 'wallet', direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

    // Helper to map category to icon - simplistic for now
    // Helper to map category to icon - simplistic for now
    const getIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'food': return Utensils;
            case 'shopping':
            case 'cosmetics':
            case 'gadgets':
            case 'games':
                return ShoppingBag;
            case 'rent':
                return Home;
            case 'entertainment': return Gamepad2;
            case 'health':
            case 'health/medical':
                return Heart;
            case 'paycheck':
            case 'bonus':
            case 'income':
            case 'debt added':
                return Banknote;
            case 'savings': return PiggyBank;
            case 'transportation': return Car;
            case 'utilities': return Zap;
            case 'travel': return Plane;
            case 'transfer': return ArrowRightLeft;
            default: return CircleDollarSign;
        }
    };

    const handleSort = (key: keyof Transaction | 'date' | 'wallet') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortData = (data: Transaction[]) => {
        if (!sortConfig) return data;

        return [...data].sort((a, b) => {
            if (sortConfig.key === 'wallet') {
                const getWalletName = (id?: string) => wallets.find(w => w.id === id)?.name || '';
                const aWallet = getWalletName(a.walletId);
                const bWallet = getWalletName(b.walletId);
                if (aWallet < bWallet) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aWallet > bWallet) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }
            if (sortConfig.key === 'date') { // explicit date handling if needed, though ISODate strings sort well too
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            }
            const aValue = a[sortConfig.key as keyof Transaction];
            const bValue = b[sortConfig.key as keyof Transaction];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const incomeCategories = ['Paycheck', 'Bonus', 'Debt Added', 'income'];

    const TransactionItem = ({ item }: { item: Transaction }) => {
        const Icon = getCategoryIcon(item.category);
        const isIncome = incomeCategories.includes(item.category);
        const isTransfer = item.type === 'transfer' || item.category === 'Transfer';

        return (
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="bg-secondary p-2.5 rounded-xl text-white shrink-0">
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground">
                    {(() => {
                        try {
                            const date = new Date(item.date);
                            if (isNaN(date.getTime())) return "Invalid Date";
                            return format(date, 'MMM dd, yyyy');
                        } catch (e) {
                            return "Invalid Date";
                        }
                    })()}
                </div>

                <div className="text-sm text-muted-foreground truncate">
                    {item.category}
                </div>

                <div className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    {isTransfer && item.toWalletId ? (
                        <>
                            <span className="text-xs opacity-70">
                                {wallets.find(w => w.id === item.walletId)?.name || 'Unknown'}
                            </span>
                            <ArrowRight className="w-3 h-3 mx-1 opacity-50" />
                            <span className="text-xs opacity-70">
                                {wallets.find(w => w.id === item.toWalletId)?.name || 'Unknown'}
                            </span>
                        </>
                    ) : (
                        item.walletId ? (
                            <>
                                <span className="text-xs opacity-70">
                                    {wallets.find(w => w.id === item.walletId)?.name || 'Unknown'}
                                </span>
                            </>
                        ) : '-'
                    )}
                </div>

                <div className={`text-sm font-bold text-right ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                    {isIncome ? '+' : (isTransfer ? '' : '-')}{currency}{Math.abs(item.actual).toFixed(2)}
                </div>
            </div>
        );
    };

    const renderList = (data: Transaction[]) => {
        return sortData(data).slice(0, 9).map(t => <TransactionItem key={t.id} item={t} />);
    };

    return (
        <Card className="bg-card border-0 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-bold font-serif text-white">Transactions</CardTitle>
                <Link to="/transactions">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white">
                        <SlidersHorizontal className="h-4 w-4" />
                        View all
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="bg-transparent p-0 mb-6 gap-2 justify-start w-full">
                        <TabsTrigger value="all" className="rounded-full bg-black text-white px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-black border border-white/10">All</TabsTrigger>
                        <TabsTrigger value="expenses" className="rounded-full bg-transparent text-muted-foreground px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-black hover:text-white transition">Expenses</TabsTrigger>
                        <TabsTrigger value="income" className="rounded-full bg-transparent text-muted-foreground px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-black hover:text-white transition">Income</TabsTrigger>
                        <TabsTrigger value="savings" className="rounded-full bg-transparent text-muted-foreground px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-black hover:text-white transition">Savings</TabsTrigger>
                        <TabsTrigger value="transfers" className="rounded-full bg-transparent text-muted-foreground px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-black hover:text-white transition">Transfers</TabsTrigger>
                    </TabsList>

                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 text-xs font-semibold text-muted-foreground mb-4 px-2">
                                <span
                                    className="cursor-pointer hover:text-white flex items-center gap-1"
                                    onClick={() => handleSort('name')}
                                >
                                    Description <ArrowUpDown className="h-3 w-3" />
                                </span>
                                <span
                                    className="cursor-pointer hover:text-white flex items-center gap-1"
                                    onClick={() => handleSort('date')}
                                >
                                    Date <ArrowUpDown className="h-3 w-3" />
                                </span>
                                <span
                                    className="cursor-pointer hover:text-white flex items-center gap-1"
                                    onClick={() => handleSort('category')}
                                >
                                    Category <ArrowUpDown className="h-3 w-3" />
                                </span>
                                <span
                                    className="cursor-pointer hover:text-white flex items-center gap-1"
                                    onClick={() => handleSort('wallet')}
                                >
                                    Payment Method <ArrowUpDown className="h-3 w-3" />
                                </span>
                                <span
                                    className="text-right cursor-pointer hover:text-white flex items-center justify-end gap-1"
                                    onClick={() => handleSort('actual')}
                                >
                                    Amount <ArrowUpDown className="h-3 w-3" />
                                </span>
                            </div>

                            <TabsContent value="all" className="space-y-1">
                                {renderList(transactions)}
                            </TabsContent>
                            <TabsContent value="expenses" className="space-y-1">
                                {renderList(transactions.filter(t => !incomeCategories.includes(t.category) && t.category !== 'Savings' && t.category !== 'Transfer' && t.type !== 'transfer'))}
                            </TabsContent>
                            <TabsContent value="income" className="space-y-1">
                                {renderList(transactions.filter(t => incomeCategories.includes(t.category)))}
                            </TabsContent>
                            <TabsContent value="savings" className="space-y-1">
                                {renderList(transactions.filter(t => t.category === 'Savings'))}
                            </TabsContent>
                            <TabsContent value="transfers" className="space-y-1">
                                {renderList(transactions.filter(t => t.type === 'transfer' || t.category === 'Transfer'))}
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
}
