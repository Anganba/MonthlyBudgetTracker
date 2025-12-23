import React, { useState, useEffect } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { BudgetMonth, Transaction } from '@shared/api';
import { BudgetHeader } from '../components/budget/Header';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Edit2, Trash2, ArrowUpDown, ArrowRight } from "lucide-react";
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

    // Use cached budget data
    const { budget, isLoading: loading, refreshBudget } = useBudget(month, year);
    const { wallets } = useWallets();
    const { user } = useAuth();

    const [currency, setCurrency] = useState('USD');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | 'wallet' | 'type'; direction: 'asc' | 'desc' } | null>(null);

    // Dialog State
    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);

    // Delete Dialog State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

    // Pagination State
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

    // Filter and Sort Logic
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
            // Default sort by date desc
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

    // Pagination Logic
    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
    const paginatedTransactions = sortedTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1); // Reset page on filter change
    }, [searchTerm, categoryFilter, typeFilter, month, year]);

    const requestSort = (key: keyof Transaction | 'wallet' | 'type') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Handlers
    const handleTransactionSubmit = async (data: TransactionData) => {
        // Snapshot
        const snapshot = queryClient.getQueryData(['budget', month, year, user?.id]);

        // Check date for optimistic update validity
        const tDate = new Date(data.date || new Date());
        // Note: We need to handle year/month matching carefully
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const tMonth = monthNames[tDate.getMonth()];
        const tYear = tDate.getFullYear();
        const isCurrentView = tMonth === month && tYear === year;

        // Optimistic Update
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
                // If success, we just refresh everything.
                // The optimistic update is already visible. 
                // We rely on refreshBudget to clean up and sync with server eventually.
                await refreshBudget();
            } else {
                // Revert
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

    // Collect unique categories for filter
    const categories = Array.from(new Set(budget?.transactions.map(t => t.category) || [])).sort();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <BudgetHeader
                month={month}
                year={year}
                onMonthChange={handleMonthChange}
                currency={currency}
                onCurrencyChange={setCurrency}
            />

            <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="font-serif text-3xl font-bold text-foreground">Transactions</h1>
                        <p className="text-muted-foreground">Manage and track your financial activity.</p>
                    </div>
                    <Button onClick={openAddDialog} className="gap-2">
                        <Plus className="h-4 w-4" /> Add Transaction
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search transactions..."
                            className="pl-9 bg-background border-border"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="savings">Savings</SelectItem>
                                <SelectItem value="transfer">Transfer</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm table-fixed">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground w-[150px]" onClick={() => requestSort('date')}>
                                        <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground w-auto" onClick={() => requestSort('name')}>
                                        <div className="flex items-center gap-1">Description <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground w-[140px]" onClick={() => requestSort('category')}>
                                        <div className="flex items-center gap-1">Category <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground w-[200px]" onClick={() => requestSort('wallet')}>
                                        <div className="flex items-center gap-1">Payment Method <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground w-[100px]" onClick={() => requestSort('type')}>
                                        <div className="flex items-center gap-1">Type <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground w-[120px]" onClick={() => requestSort('actual')}>
                                        <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground w-[80px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                                ) : paginatedTransactions.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No transactions found.</td></tr>
                                ) : (
                                    paginatedTransactions.map((t) => {
                                        const type = getTransactionType(t);
                                        const isIncome = type === 'income';
                                        return (
                                            <tr key={t.id} className="border-b border-border hover:bg-muted/50 transition">
                                                <td className="py-3 px-4 text-foreground">{t.date ? format(new Date(t.date), 'MMM dd, yyyy') : '-'}</td>
                                                <td className="py-3 px-4 font-medium text-foreground">{t.name}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                        {t.category}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-foreground">
                                                    {type === 'transfer' && t.toWalletId ? (
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <span>{wallets.find(w => w.id === t.walletId)?.name}</span>
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                            <span>{wallets.find(w => w.id === t.toWalletId)?.name}</span>
                                                        </div>
                                                    ) : (
                                                        t.walletId ? (
                                                            <span className="text-xs">{wallets.find(w => w.id === t.walletId)?.name || '-'}</span>
                                                        ) : '-'
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-foreground capitalize">{type}</td>
                                                <td className={cn("py-3 px-4 text-right font-medium", isIncome ? "text-emerald-600" : "text-foreground")}>
                                                    {isIncome ? '+' : ''}{symbol}{t.actual.toFixed(2)}
                                                </td>
                                                <td className="py-3 px-4 text-right flex justify-end gap-2">
                                                    <button
                                                        className="p-1 hover:bg-yellow-100 text-yellow-500 rounded transition"
                                                        onClick={() => openEditDialog(t)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className="p-1 hover:bg-red-100 text-red-500 rounded transition"
                                                        onClick={() => openDeleteDialog(t.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span>Rows per page:</span>
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={itemsPerPage} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-4">
                            <span>
                                Showing {paginatedTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} of {sortedTransactions.length} results
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the transaction.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
