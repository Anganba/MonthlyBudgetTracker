import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SlidersHorizontal, ArrowUpDown, ArrowRight, Receipt } from "lucide-react";
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
            if (sortConfig.key === 'date') {
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

    // Mobile card view for a transaction
    const MobileTransactionCard = ({ item }: { item: Transaction }) => {
        const Icon = getCategoryIcon(item.category);
        const isIncome = incomeCategories.includes(item.category);
        const isTransfer = item.type === 'transfer' || item.category === 'Transfer';

        return (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className={`p-2 rounded-xl shrink-0 ${isIncome ? 'bg-green-500/20' : isTransfer ? 'bg-purple-500/20' : 'bg-white/10'}`}>
                    <Icon className={`w-4 h-4 ${isIncome ? 'text-green-400' : isTransfer ? 'text-purple-400' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span>{format(new Date(item.date), 'MMM d')}</span>
                        <span>•</span>
                        <span className="truncate">{item.category}</span>
                    </div>
                </div>
                <div className={`text-sm font-semibold ${isIncome ? 'text-green-400' : 'text-white'}`}>
                    {isIncome ? '+' : (isTransfer ? '' : '-')}{currency}{Math.abs(item.actual).toFixed(0)}
                </div>
            </div>
        );
    };

    // Desktop table row
    const TransactionItem = ({ item }: { item: Transaction }) => {
        const Icon = getCategoryIcon(item.category);
        const isIncome = incomeCategories.includes(item.category);
        const isTransfer = item.type === 'transfer' || item.category === 'Transfer';

        return (
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-3 rounded-lg transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-xl shrink-0 ${isIncome ? 'bg-green-500/20' : isTransfer ? 'bg-purple-500/20' : 'bg-white/10'}`}>
                        <Icon className={`w-4 h-4 ${isIncome ? 'text-green-400' : isTransfer ? 'text-purple-400' : 'text-gray-400'}`} />
                    </div>
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                </div>

                <div className="text-sm text-gray-500">
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

                <div className="text-sm text-gray-500 truncate">
                    {item.category}
                </div>

                <div className="text-sm text-gray-500 truncate flex items-center gap-1">
                    {isTransfer && item.toWalletId ? (
                        <>
                            <span className="text-xs">
                                {wallets.find(w => w.id === item.walletId)?.name || 'Unknown'}
                            </span>
                            <ArrowRight className="w-3 h-3 mx-1 text-gray-600" />
                            <span className="text-xs">
                                {wallets.find(w => w.id === item.toWalletId)?.name || 'Unknown'}
                            </span>
                        </>
                    ) : (
                        item.walletId ? (
                            <span className="text-xs">
                                {wallets.find(w => w.id === item.walletId)?.name || 'Unknown'}
                            </span>
                        ) : '-'
                    )}
                </div>

                <div className={`text-sm font-semibold text-right ${isIncome ? 'text-green-400' : 'text-white'}`}>
                    {isIncome ? '+' : (isTransfer ? '' : '-')}{currency}{Math.abs(item.actual).toFixed(2)}
                </div>
            </div>
        );
    };

    const renderMobileList = (data: Transaction[]) => {
        return sortData(data).slice(0, 9).map(t => <MobileTransactionCard key={t.id} item={t} />);
    };

    const renderList = (data: Transaction[]) => {
        return sortData(data).slice(0, 9).map(t => <TransactionItem key={t.id} item={t} />);
    };

    return (
        <div className="rounded-xl md:rounded-2xl bg-zinc-900/50 border border-white/10 overflow-hidden h-full">
            <div className="p-3 md:p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-white/10">
                        <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                    </div>
                    <h2 className="text-base md:text-lg font-bold font-serif text-white">Transactions</h2>
                </div>
                <Link to="/transactions">
                    <Button variant="ghost" size="sm" className="gap-1.5 md:gap-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg md:rounded-xl text-xs md:text-sm h-8 md:h-9 px-2 md:px-3">
                        <SlidersHorizontal className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">View all</span>
                        <span className="sm:hidden">All</span>
                    </Button>
                </Link>
            </div>
            <div className="p-3 md:p-4">
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="bg-transparent p-0 mb-3 md:mb-4 gap-1.5 md:gap-2 justify-start w-full flex-wrap">
                        <TabsTrigger value="all" className="rounded-lg md:rounded-xl bg-zinc-800 text-white px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-black border border-white/10 data-[state=active]:border-primary">All</TabsTrigger>
                        <TabsTrigger value="expenses" className="rounded-lg md:rounded-xl bg-transparent text-gray-500 px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 hover:text-white transition border border-transparent data-[state=active]:border-red-500/30">Exp</TabsTrigger>
                        <TabsTrigger value="income" className="rounded-lg md:rounded-xl bg-transparent text-gray-500 px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 hover:text-white transition border border-transparent data-[state=active]:border-green-500/30">Inc</TabsTrigger>
                        <TabsTrigger value="savings" className="rounded-lg md:rounded-xl bg-transparent text-gray-500 px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 hover:text-white transition border border-transparent data-[state=active]:border-blue-500/30 hidden sm:flex">Sav</TabsTrigger>
                        <TabsTrigger value="transfers" className="rounded-lg md:rounded-xl bg-transparent text-gray-500 px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 hover:text-white transition border border-transparent data-[state=active]:border-purple-500/30 hidden sm:flex">Xfer</TabsTrigger>
                    </TabsList>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-2">
                        <TabsContent value="all" className="space-y-2 mt-0">
                            {renderMobileList(transactions)}
                        </TabsContent>
                        <TabsContent value="expenses" className="space-y-2 mt-0">
                            {renderMobileList(transactions.filter(t => !incomeCategories.includes(t.category) && t.category !== 'Savings' && t.category !== 'Transfer' && t.type !== 'transfer'))}
                        </TabsContent>
                        <TabsContent value="income" className="space-y-2 mt-0">
                            {renderMobileList(transactions.filter(t => incomeCategories.includes(t.category)))}
                        </TabsContent>
                        <TabsContent value="savings" className="space-y-2 mt-0">
                            {renderMobileList(transactions.filter(t => t.category === 'Savings'))}
                        </TabsContent>
                        <TabsContent value="transfers" className="space-y-2 mt-0">
                            {renderMobileList(transactions.filter(t => t.type === 'transfer' || t.category === 'Transfer'))}
                        </TabsContent>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <div className="min-w-[700px]">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 text-xs font-medium text-gray-500 mb-3 px-3">
                                <span
                                    className="cursor-pointer hover:text-primary flex items-center gap-1 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    Description <ArrowUpDown className="h-3 w-3" />
                                </span>
                                <span
                                    className="cursor-pointer hover:text-primary flex items-center gap-1 transition-colors"
                                    onClick={() => handleSort('date')}
                                >
                                    Date <ArrowUpDown className="h-3 w-3" />
                                </span>
                                <span
                                    className="cursor-pointer hover:text-primary flex items-center gap-1 transition-colors"
                                    onClick={() => handleSort('category')}
                                >
                                    Category <ArrowUpDown className="h-3 w-3" />
                                </span>
                                <span
                                    className="cursor-pointer hover:text-primary flex items-center gap-1 transition-colors"
                                    onClick={() => handleSort('wallet')}
                                >
                                    Wallet <ArrowUpDown className="h-3 w-3" />
                                </span>
                                <span
                                    className="text-right cursor-pointer hover:text-primary flex items-center justify-end gap-1 transition-colors"
                                    onClick={() => handleSort('actual')}
                                >
                                    Amount <ArrowUpDown className="h-3 w-3" />
                                </span>
                            </div>

                            <TabsContent value="all" className="space-y-0 mt-0">
                                {renderList(transactions)}
                            </TabsContent>
                            <TabsContent value="expenses" className="space-y-0 mt-0">
                                {renderList(transactions.filter(t => !incomeCategories.includes(t.category) && t.category !== 'Savings' && t.category !== 'Transfer' && t.type !== 'transfer'))}
                            </TabsContent>
                            <TabsContent value="income" className="space-y-0 mt-0">
                                {renderList(transactions.filter(t => incomeCategories.includes(t.category)))}
                            </TabsContent>
                            <TabsContent value="savings" className="space-y-0 mt-0">
                                {renderList(transactions.filter(t => t.category === 'Savings'))}
                            </TabsContent>
                            <TabsContent value="transfers" className="space-y-0 mt-0">
                                {renderList(transactions.filter(t => t.type === 'transfer' || t.category === 'Transfer'))}
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
