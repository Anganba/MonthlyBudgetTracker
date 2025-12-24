import React, { useState, useEffect } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { BudgetMonth, Transaction } from '@shared/api';
import { BudgetHeader } from '../components/budget/Header';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Edit2, Trash2, ArrowUpDown, ArrowRight, ArrowDownCircle, ArrowUpCircle, PiggyBank, ArrowLeftRight, Receipt } from "lucide-react";
import { format } from 'date-fns';
import { TransactionDialog, TransactionData } from "../components/budget/TransactionDialog";
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
import { cn } from "@/lib/utils";

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

import { useBudget } from "@/hooks/use-budget";
import { useWallets } from '@/hooks/use-wallets';
import { useAuth } from "@/lib/auth";

export function TransactionsPage() {
    const queryClient = useQueryClient();
    const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
    const [year, setYear] = useState(new Date().getFullYear());

    const { budget, isLoading: loading, refreshBudget } = useBudget(month, year);
    const { wallets } = useWallets();
    const { user } = useAuth();

    const [currency, setCurrency] = useState('USD');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | 'wallet' | 'type'; direction: 'asc' | 'desc' } | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleMonthChange = (newMonth: string, newYear: number) => {
        setMonth(newMonth);
        setYear(newYear);
    };

    const getCurrencySymbol = (curr: string) => {
        const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', BDT: '৳' };
        return symbols[curr] || '$';
    };
    const symbol = getCurrencySymbol(currency);

    const getTransactionType = (t: Transaction) => {
        if (['Savings'].includes(t.category)) return 'savings';
        if (t.type) return t.type;
        if (['Paycheck', 'Bonus', 'Debt Added'].includes(t.category)) return 'income';
        return 'expense';
    };

    const getTypeInfo = (type: string) => {
        switch (type) {
            case 'income': return { icon: ArrowUpCircle, color: 'text-green-400', bg: 'bg-green-500/20' };
            case 'expense': return { icon: ArrowDownCircle, color: 'text-red-400', bg: 'bg-red-500/20' };
            case 'savings': return { icon: PiggyBank, color: 'text-blue-400', bg: 'bg-blue-500/20' };
            case 'transfer': return { icon: ArrowLeftRight, color: 'text-purple-400', bg: 'bg-purple-500/20' };
            default: return { icon: Receipt, color: 'text-gray-400', bg: 'bg-gray-500/20' };
        }
    };

    const filteredTransactions = budget?.transactions.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        const type = getTransactionType(t);
        const matchesType = typeFilter === 'all' || type === typeFilter;
        return matchesSearch && matchesCategory && matchesType;
    }) || [];

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        if (!sortConfig) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortConfig.key === 'wallet') {
            const getWalletName = (id?: string) => wallets.find(w => w.id === id)?.name || '';
            const aWallet = getWalletName(a.walletId);
            const bWallet = getWalletName(b.walletId);
            if (aWallet < bWallet) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aWallet > bWallet) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }
        if (sortConfig.key === 'type') {
            const aType = getTransactionType(a);
            const bType = getTransactionType(b);
            if (aType < bType) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aType > bType) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }
        const aValue = a[sortConfig.key as keyof Transaction];
        const bValue = b[sortConfig.key as keyof Transaction];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
    const paginatedTransactions = sortedTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, categoryFilter, typeFilter, month, year]);

    const requestSort = (key: keyof Transaction | 'wallet' | 'type') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleTransactionSubmit = async (data: TransactionData) => {
        const snapshot = queryClient.getQueryData(['budget', month, year, user?.id]);
        const tDate = new Date(data.date || new Date());
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const tMonth = monthNames[tDate.getMonth()];
        const tYear = tDate.getFullYear();
        const isCurrentView = tMonth === month && tYear === year;

        const tempId = Math.random().toString(36).substring(7);
        const optimisticTransaction = {
            ...data,
            id: data.id || tempId,
            date: data.date || new Date().toISOString()
        };

        if (user?.id && isCurrentView) {
            queryClient.setQueryData(['budget', month, year, user.id], (old: any) => {
                if (!old) return old;
                let newTransactions;
                if (dialogMode === 'edit' && data.id) {
                    newTransactions = old.transactions.map((t: any) => t.id === data.id ? optimisticTransaction : t);
                } else {
                    newTransactions = [optimisticTransaction, ...(old.transactions || [])];
                }
                return { ...old, transactions: newTransactions };
            });
        }

        try {
            const url = dialogMode === 'add'
                ? `/api/budget/transaction?month=${month}&year=${year}`
                : `/api/budget/transaction?month=${month}&year=${year}&id=${data.id}`;
            const method = dialogMode === 'add' ? 'POST' : 'PUT';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                await refreshBudget();
            } else {
                if (snapshot && user?.id && isCurrentView) queryClient.setQueryData(['budget', month, year, user.id], snapshot);
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            if (snapshot && user?.id && isCurrentView) queryClient.setQueryData(['budget', month, year, user.id], snapshot);
        }
    };

    const openAddDialog = () => {
        setDialogMode('add');
        setSelectedTransaction(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (transaction: Transaction) => {
        setDialogMode('edit');
        setSelectedTransaction(transaction);
        setIsDialogOpen(true);
    };

    const openDeleteDialog = (id: string) => {
        setTransactionToDelete(id);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!transactionToDelete) return;
        try {
            await fetch(`/api/budget/transaction?month=${month}&year=${year}&id=${transactionToDelete}`, { method: 'DELETE' });
            await refreshBudget();
        } catch (error) { console.error(error); }
        setIsDeleteOpen(false);
        setTransactionToDelete(null);
    };

    const categories = Array.from(new Set(budget?.transactions.map(t => t.category) || [])).sort();

    // Stats
    const totalIncome = filteredTransactions.filter(t => getTransactionType(t) === 'income').reduce((sum, t) => sum + t.actual, 0);
    const totalExpenses = filteredTransactions.filter(t => getTransactionType(t) === 'expense').reduce((sum, t) => sum + t.actual, 0);

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <BudgetHeader
                month={month}
                year={year}
                onMonthChange={handleMonthChange}
                currency={currency}
                onCurrencyChange={setCurrency}
            />

            <div className="p-6 md:p-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">Transactions</h1>
                        <p className="text-gray-500 mt-1">Manage and track your financial activity</p>
                    </div>
                    <Button
                        onClick={openAddDialog}
                        className="bg-primary text-black hover:bg-primary/90 rounded-2xl px-6 h-11 font-bold shadow-lg shadow-primary/20 gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Transaction
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/10">
                                <Receipt className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Transactions</p>
                                <p className="text-2xl font-bold text-white">{sortedTransactions.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/20">
                                <ArrowUpCircle className="h-6 w-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Income</p>
                                <p className="text-2xl font-bold text-green-400">{symbol}{totalIncome.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-500/20">
                                <ArrowDownCircle className="h-6 w-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-400">{symbol}{totalExpenses.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-2xl bg-zinc-900/50 border border-white/10 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search transactions..."
                            className="pl-11 h-11 bg-zinc-800 border-zinc-700 rounded-xl focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[140px] h-11 bg-zinc-800 border-zinc-700 rounded-xl">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="savings">Savings</SelectItem>
                                <SelectItem value="transfer">Transfer</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[180px] h-11 bg-zinc-800 border-zinc-700 rounded-xl">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl bg-zinc-900/50 border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="text-left py-4 px-4 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('date')}>
                                        <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('name')}>
                                        <div className="flex items-center gap-1">Description <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('category')}>
                                        <div className="flex items-center gap-1">Category <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('wallet')}>
                                        <div className="flex items-center gap-1">Wallet <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('type')}>
                                        <div className="flex items-center gap-1">Type <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-right py-4 px-4 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('actual')}>
                                        <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-right py-4 px-4 font-medium text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-gray-500">Loading...</td></tr>
                                ) : paginatedTransactions.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-gray-500">No transactions found.</td></tr>
                                ) : (
                                    paginatedTransactions.map((t) => {
                                        const type = getTransactionType(t);
                                        const typeInfo = getTypeInfo(type);
                                        const TypeIcon = typeInfo.icon;
                                        const isIncome = type === 'income';
                                        return (
                                            <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-4 px-4 text-gray-300">{t.date ? format(new Date(t.date), 'MMM dd, yyyy') : '-'}</td>
                                                <td className="py-4 px-4 font-medium text-white">{t.name}</td>
                                                <td className="py-4 px-4">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                                                        {t.category}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-gray-300">
                                                    {type === 'transfer' && t.toWalletId ? (
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <span>{wallets.find(w => w.id === t.walletId)?.name}</span>
                                                            <ArrowRight className="h-3 w-3 text-gray-500" />
                                                            <span>{wallets.find(w => w.id === t.toWalletId)?.name}</span>
                                                        </div>
                                                    ) : (
                                                        t.walletId ? (
                                                            <span className="text-sm">{wallets.find(w => w.id === t.walletId)?.name || '-'}</span>
                                                        ) : '-'
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize", typeInfo.bg, typeInfo.color)}>
                                                        <TypeIcon className="h-3 w-3" />
                                                        {type}
                                                    </span>
                                                </td>
                                                <td className={cn("py-4 px-4 text-right font-semibold", isIncome ? "text-green-400" : "text-white")}>
                                                    {isIncome ? '+' : ''}{symbol}{t.actual.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            className="p-2 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-colors"
                                                            onClick={() => openEditDialog(t)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                                            onClick={() => openDeleteDialog(t.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                            <span>Rows per page:</span>
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-9 w-[70px] bg-zinc-800 border-zinc-700 rounded-lg">
                                    <SelectValue placeholder={itemsPerPage} />
                                </SelectTrigger>
                                <SelectContent side="top" className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-4">
                            <span>
                                Showing {paginatedTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} of {sortedTransactions.length}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="border-zinc-700 hover:bg-zinc-800"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="border-zinc-700 hover:bg-zinc-800"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TransactionDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleTransactionSubmit}
                initialData={selectedTransaction}
                mode={dialogMode}
            />

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="bg-zinc-900 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-serif">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            This action cannot be undone. This will permanently delete the transaction.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-zinc-700 hover:bg-zinc-800">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
