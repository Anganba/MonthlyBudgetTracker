import React, { useState, useEffect } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { BudgetMonth, Transaction } from '@shared/api';
import { BudgetHeader } from '../components/budget/Header';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Edit2, Trash2, ArrowUpDown } from "lucide-react";
import { format } from 'date-fns';
import { TransactionDialog, TransactionData } from "../components/budget/TransactionDialog";
import { cn } from "@/lib/utils";

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

import { useBudget } from "@/hooks/use-budget";

export function TransactionsPage() {
    const queryClient = useQueryClient();
    const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
    const [year, setYear] = useState(new Date().getFullYear());

    // Use cached budget data
    const { budget, isLoading: loading, refreshBudget } = useBudget(month, year);

    const [currency, setCurrency] = useState('USD');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>(null);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);

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

    const getCategoryType = (category: string) => {
        if (['Paycheck', 'Bonus', 'Debt Added'].includes(category)) return 'income';
        if (['Savings'].includes(category)) return 'savings';
        return 'expense';
    };

    // Filter and Sort Logic
    const filteredTransactions = budget?.transactions.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        const type = getCategoryType(t.category);
        const matchesType = typeFilter === 'all' || type === typeFilter;

        return matchesSearch && matchesCategory && matchesType;
    }) || [];

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        if (!sortConfig) {
            // Default sort by date desc
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

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

    const requestSort = (key: keyof Transaction) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Handlers
    const handleTransactionSubmit = async (data: TransactionData) => {
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
                refreshBudget();
                queryClient.invalidateQueries({ queryKey: ['goals'] });
            }
        } catch (error) { console.error('Error saving transaction:', error); }
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

    const handleDeleteTransaction = async (id: string) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await fetch(`/api/budget/transaction?month=${month}&year=${year}&id=${id}`, { method: 'DELETE' });
            refreshBudget();
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        } catch (error) { console.error(error); }
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
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => requestSort('date')}>
                                        <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => requestSort('name')}>
                                        <div className="flex items-center gap-1">Description <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => requestSort('category')}>
                                        <div className="flex items-center gap-1">Category <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Type</th>
                                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => requestSort('actual')}>
                                        <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                                ) : paginatedTransactions.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No transactions found.</td></tr>
                                ) : (
                                    paginatedTransactions.map((t) => {
                                        const type = getCategoryType(t.category);
                                        const isIncome = type === 'income';
                                        return (
                                            <tr key={t.id} className="border-b border-border hover:bg-muted/50 transition">
                                                <td className="py-3 px-4 text-foreground">{t.date ? format(new Date(t.date), 'MMM dd, yyyy') : '-'}</td>
                                                <td className="py-3 px-4 font-medium text-foreground">{t.name}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                                        {t.category}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground capitalize">{type}</td>
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
                                                        onClick={() => handleDeleteTransaction(t.id)}
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
        </div>
    );
}
