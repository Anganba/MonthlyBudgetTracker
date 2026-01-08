import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useWallets } from '@/hooks/use-wallets';
import { useGoals } from '@/hooks/use-goals';
import { Download, FileSpreadsheet, FileText, FileJson, Calendar, Loader2, CheckCircle2, Package, Target, Repeat } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type ExportFormat = 'csv' | 'excel' | 'json';
type DateRange = 'all' | 'thisMonth' | 'last3Months' | 'last6Months' | 'thisYear';

const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'last3Months', label: 'Last 3 Months' },
    { value: 'last6Months', label: 'Last 6 Months' },
    { value: 'thisYear', label: 'This Year' },
];

const formatOptions: { value: ExportFormat; label: string; description: string; icon: React.ElementType }[] = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values', icon: FileText },
    { value: 'excel', label: 'Excel', description: 'Formatted spreadsheet (.xlsx)', icon: FileSpreadsheet },
    { value: 'json', label: 'JSON', description: 'Structured data format', icon: FileJson },
];

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
    const { toast } = useToast();
    const { wallets } = useWallets();
    const { goals } = useGoals();

    const [format, setFormat] = useState<ExportFormat>('excel');
    const [dateRange, setDateRange] = useState<DateRange>('all');
    const [includeTransactions, setIncludeTransactions] = useState(true);
    const [includeWallets, setIncludeWallets] = useState(false);
    const [includeGoals, setIncludeGoals] = useState(false);
    const [includeRecurring, setIncludeRecurring] = useState(false);
    const [includeSummary, setIncludeSummary] = useState(false);

    const [isExporting, setIsExporting] = useState(false);
    const [transactionCount, setTransactionCount] = useState<number | null>(null);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [recurringRules, setRecurringRules] = useState<any[]>([]);

    // Fetch transactions and recurring rules when dialog opens
    useEffect(() => {
        if (open) {
            fetchTransactionPreview();
            fetchRecurringRules();
        }
    }, [open, dateRange]);

    const getDateRangeStart = (range: DateRange): Date | null => {
        const now = new Date();
        switch (range) {
            case 'thisMonth':
                return new Date(now.getFullYear(), now.getMonth(), 1);
            case 'last3Months':
                return new Date(now.getFullYear(), now.getMonth() - 3, 1);
            case 'last6Months':
                return new Date(now.getFullYear(), now.getMonth() - 6, 1);
            case 'thisYear':
                return new Date(now.getFullYear(), 0, 1);
            case 'all':
            default:
                return null;
        }
    };

    const filterTransactions = (transactions: any[], range: DateRange) => {
        const startDate = getDateRangeStart(range);
        if (!startDate) return transactions;
        return transactions.filter(t => new Date(t.date) >= startDate);
    };

    const fetchTransactionPreview = async () => {
        try {
            const response = await fetch('/api/budget/all');
            const result = await response.json();

            if (result.success && result.data) {
                setAllTransactions(result.data);
                const filtered = filterTransactions(result.data, dateRange);
                setTransactionCount(filtered.length);
            } else {
                setTransactionCount(0);
            }
        } catch (error) {
            console.error('Failed to fetch preview:', error);
            setTransactionCount(0);
        }
    };

    const fetchRecurringRules = async () => {
        try {
            const response = await fetch('/api/recurring');
            const result = await response.json();
            if (result.success && result.data) {
                setRecurringRules(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch recurring rules:', error);
        }
    };

    const categorizeTransaction = (t: any) => {
        const isIncome = ['Paycheck', 'Bonus', 'Debt Added', 'income'].includes(t.category) || t.type === 'income';
        const isSavings = t.category === 'Savings';
        const isGoal = t.name?.startsWith("Goal Reached:");
        const isTransfer = t.type === 'transfer';

        if (isTransfer) return 'Transfer';
        if (isIncome) return 'Income';
        if (isSavings) return 'Savings';
        if (isGoal) return 'Goal Completion';
        return 'Expense';
    };

    // Helper function to get wallet name by ID
    const getWalletName = (walletId: string | undefined): string => {
        if (!walletId) return 'N/A';
        const wallet = wallets.find(w => w.id === walletId);
        return wallet ? wallet.name : 'Unknown Wallet';
    };

    const escapeCsvField = (field: any): string => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };

    const generateCsv = (transactions: any[]) => {
        const sections: string[] = [];

        // Transactions CSV
        if (includeTransactions && transactions.length > 0) {
            const headers = ['Date', 'Time', 'Name', 'Category', 'Amount', 'Type', 'Wallet'];
            const rows = transactions.map(t => {
                const date = new Date(t.date);
                // Try to extract time if available, otherwise default
                let timeStr = '';
                // Since our new logic adds timestamp separately or merges, let's assume `t.date` might handle it or we look at `t.timestamp` if it exists (but API merges them often)
                // Actually `t.date` is likely just the date string YYYY-MM-DD from the `budget.ts` route if it comes from `budget.transactions` array which stores strings?
                // Wait, recent changes added `timestamp` field.
                // Let's check if we can parse time from `t`.
                // If the new schema has `createdAt` or specific `timestamp`, we use that.
                // Based on recent changes, we added `timestamp` to transaction object? No, we added it to the Mongo schema.
                // Let's assume `t` has it if fetched via `/api/budget/all`.

                // If t.timestamp is available (it should be since we updated schema + route)
                const timestamp = t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '';

                return [
                    t.date,
                    timestamp,
                    t.name,
                    t.category,
                    Math.abs(t.actual).toString(),
                    categorizeTransaction(t),
                    getWalletName(t.walletId)
                ];
            });
            sections.push('TRANSACTIONS\n' + headers.join(',') + '\n' + rows.map(row => row.map(escapeCsvField).join(',')).join('\n'));
        }

        // Wallets CSV
        if (includeWallets && wallets.length > 0) {
            const headers = ['Name', 'Type', 'Balance', 'Description', 'Is Default', 'Is Savings'];
            const rows = wallets.map(w => [
                w.name,
                w.type,
                w.balance.toString(),
                w.description || '',
                w.isDefault ? 'Yes' : 'No',
                w.isSavingsWallet ? 'Yes' : 'No'
            ]);
            sections.push('WALLETS\n' + headers.join(',') + '\n' + rows.map(row => row.map(escapeCsvField).join(',')).join('\n'));
        }

        // Goals CSV
        if (includeGoals && goals && goals.length > 0) {
            const headers = ['Name', 'Status', 'Current Amount', 'Target Amount', 'Category', 'Target Date'];
            const rows = goals.map(g => [
                g.name,
                g.status || 'active',
                g.currentAmount.toString(),
                g.targetAmount.toString(),
                g.category,
                g.targetDate ? new Date(g.targetDate).toLocaleDateString() : ''
            ]);
            sections.push('GOALS\n' + headers.join(',') + '\n' + rows.map(row => row.map(escapeCsvField).join(',')).join('\n'));
        }

        // Recurring Rules CSV
        if (includeRecurring && recurringRules && recurringRules.length > 0) {
            const headers = ['Name', 'Amount', 'Frequency', 'Type', 'Category', 'Next Run', 'Active', 'Wallet'];
            const rows = recurringRules.map(r => [
                r.name,
                r.amount.toString(),
                r.frequency,
                r.type,
                r.category,
                r.nextRunDate ? new Date(r.nextRunDate).toLocaleDateString() : '',
                r.active ? 'Yes' : 'No',
                getWalletName(r.walletId)
            ]);
            sections.push('RECURRING RULES\n' + headers.join(',') + '\n' + rows.map(row => row.map(escapeCsvField).join(',')).join('\n'));
        }

        return sections.join('\n\n');
    };

    const generateExcel = (transactions: any[]) => {
        const workbook = XLSX.utils.book_new();

        // Transactions Sheet
        if (includeTransactions && transactions.length > 0) {
            const transactionData = transactions.map(t => ({
                Date: t.date,
                Time: t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '',
                Name: t.name,
                Category: t.category,
                Amount: Math.abs(t.actual),
                Type: categorizeTransaction(t),
                Wallet: getWalletName(t.walletId)
            }));
            const wsTransactions = XLSX.utils.json_to_sheet(transactionData);
            wsTransactions['!cols'] = [
                { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(workbook, wsTransactions, 'Transactions');
        }

        // Wallets Sheet
        if (includeWallets && wallets.length > 0) {
            const walletData = wallets.map(w => ({
                Name: w.name,
                Type: w.type.charAt(0).toUpperCase() + w.type.slice(1).replace('_', ' '),
                Balance: w.balance,
                Description: w.description || '',
                Default: w.isDefault ? 'Yes' : 'No',
                Savings: w.isSavingsWallet ? 'Yes' : 'No'
            }));
            const wsWallets = XLSX.utils.json_to_sheet(walletData);
            wsWallets['!cols'] = [
                { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 8 }, { wch: 8 }
            ];
            XLSX.utils.book_append_sheet(workbook, wsWallets, 'Wallets');
        }

        // Goals Sheet
        if (includeGoals && goals && goals.length > 0) {
            const goalData = goals.map(g => ({
                Name: g.name,
                Status: (g.status || 'active').toUpperCase(),
                Current: g.currentAmount,
                Target: g.targetAmount,
                Progress: Math.round((g.currentAmount / g.targetAmount) * 100) + '%',
                Category: g.category,
                Deadline: g.targetDate ? new Date(g.targetDate).toLocaleDateString() : 'None'
            }));
            const wsGoals = XLSX.utils.json_to_sheet(goalData);
            wsGoals['!cols'] = [
                { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(workbook, wsGoals, 'Goals');
        }

        // Recurring Rules Sheet
        if (includeRecurring && recurringRules && recurringRules.length > 0) {
            const recurringData = recurringRules.map(r => ({
                Name: r.name,
                Amount: r.amount,
                Frequency: r.frequency.charAt(0).toUpperCase() + r.frequency.slice(1),
                Type: r.type,
                Category: r.category,
                NextRun: r.nextRunDate ? new Date(r.nextRunDate).toLocaleDateString() : '',
                Active: r.active ? 'Yes' : 'No',
                Wallet: getWalletName(r.walletId)
            }));
            const wsRecurring = XLSX.utils.json_to_sheet(recurringData);
            wsRecurring['!cols'] = [
                { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(workbook, wsRecurring, 'Recurring Rules');
        }

        // Summary Sheet
        if (includeSummary) {
            const monthlyData: Record<string, { income: number; expenses: number; savings: number }> = {};
            transactions.forEach(t => {
                const monthKey = t.date?.substring(0, 7) || 'Unknown';
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { income: 0, expenses: 0, savings: 0 };
                }
                const type = categorizeTransaction(t);
                const amount = Math.abs(t.actual);
                if (type === 'Income') monthlyData[monthKey].income += amount;
                else if (type === 'Savings') monthlyData[monthKey].savings += amount;
                else if (type === 'Expense') monthlyData[monthKey].expenses += amount;
            });

            const summaryData = Object.entries(monthlyData)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, data]) => ({
                    Month: month,
                    Income: data.income,
                    Expenses: data.expenses,
                    Savings: data.savings,
                    Balance: data.income - data.expenses - data.savings
                }));

            if (summaryData.length > 0) {
                const wsSummary = XLSX.utils.json_to_sheet(summaryData);
                wsSummary['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
                XLSX.utils.book_append_sheet(workbook, wsSummary, 'Monthly Summary');
            }
        }

        return workbook;
    };

    const generateJson = (transactions: any[]) => {
        const data: any = {};

        if (includeTransactions) {
            data.transactions = transactions.map(t => ({
                date: t.date,
                timestamp: t.timestamp,
                name: t.name,
                category: t.category,
                amount: Math.abs(t.actual),
                type: categorizeTransaction(t),
                wallet: getWalletName(t.walletId)
            }));
        }

        if (includeWallets) {
            data.wallets = wallets.map(w => ({
                name: w.name,
                type: w.type,
                balance: w.balance,
                description: w.description || null,
                isDefault: w.isDefault,
                isSavings: w.isSavingsWallet
            }));
        }

        if (includeGoals) {
            data.goals = goals?.map(g => ({
                name: g.name,
                status: g.status,
                currentAmount: g.currentAmount,
                targetAmount: g.targetAmount,
                category: g.category,
                targetDate: g.targetDate
            })) || [];
        }

        if (includeRecurring) {
            data.recurringRules = recurringRules.map(r => ({
                name: r.name,
                amount: r.amount,
                frequency: r.frequency,
                type: r.type,
                category: r.category,
                nextRunDate: r.nextRunDate,
                active: r.active,
                walletId: r.walletId
            }));
        }

        if (includeSummary) {
            const totalIncome = transactions.filter(t => categorizeTransaction(t) === 'Income').reduce((sum, t) => sum + Math.abs(t.actual), 0);
            const totalExpenses = transactions.filter(t => categorizeTransaction(t) === 'Expense').reduce((sum, t) => sum + Math.abs(t.actual), 0);
            const totalSavings = transactions.filter(t => categorizeTransaction(t) === 'Savings').reduce((sum, t) => sum + Math.abs(t.actual), 0);
            data.summary = {
                totalIncome,
                totalExpenses,
                totalSavings,
                netBalance: totalIncome - totalExpenses - totalSavings,
                transactionCount: transactions.length,
                exportDate: new Date().toISOString()
            };
        }

        return JSON.stringify(data, null, 2);
    };

    const handleExport = async () => {
        if (!includeTransactions && !includeWallets && !includeSummary && !includeGoals && !includeRecurring) {
            toast({
                title: "Nothing to Export",
                description: "Please select at least one data type to export.",
                variant: "destructive"
            });
            return;
        }

        setIsExporting(true);

        try {
            const filteredTransactions = filterTransactions(allTransactions, dateRange);
            let content: string | ArrayBuffer;
            let filename: string;
            let mimeType: string;
            const dateStr = new Date().toISOString().split('T')[0];

            switch (format) {
                case 'csv':
                    content = generateCsv(filteredTransactions);
                    filename = `budget_export_${dateStr}.csv`;
                    mimeType = 'text/csv;charset=utf-8';
                    break;
                case 'excel':
                    const workbook = generateExcel(filteredTransactions);
                    content = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                    filename = `budget_export_${dateStr}.xlsx`;
                    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    break;
                case 'json':
                    content = generateJson(filteredTransactions);
                    filename = `budget_export_${dateStr}.json`;
                    mimeType = 'application/json';
                    break;
                default:
                    throw new Error('Unknown format');
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
                title: "Export Successful",
                description: `Your data has been exported as ${filename}`,
            });
            onOpenChange(false);
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: "Export Failed",
                description: "An error occurred while exporting your data.",
                variant: "destructive"
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-zinc-900 border-white/10 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/20">
                            <Download className="h-5 w-5 text-primary" />
                        </div>
                        Export Data
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Download your financial data in your preferred format.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Format Selection */}
                    <div className="space-y-3">
                        <Label className="text-gray-400 text-sm uppercase tracking-wider">Export Format</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {formatOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = format === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setFormat(option.value)}
                                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group ${isSelected
                                            ? 'border-primary bg-primary/10'
                                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
                                            }`}
                                    >
                                        {isSelected && (
                                            <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                                        )}
                                        <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-primary' : 'text-gray-400 group-hover:text-gray-300'}`} />
                                        <p className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                            {option.label}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-3">
                        <Label className="text-gray-400 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date Range
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {dateRangeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setDateRange(option.value)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${dateRange === option.value
                                        ? 'bg-primary text-black'
                                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Data Selection */}
                    <div className="space-y-3">
                        <Label className="text-gray-400 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Include Data
                        </Label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition-colors">
                                <Checkbox
                                    checked={includeTransactions}
                                    onCheckedChange={(checked) => setIncludeTransactions(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="flex-1">
                                    <p className="text-white font-medium">Transactions</p>
                                    <p className="text-xs text-gray-500">All your income, expenses, and transfers</p>
                                </div>
                                {transactionCount !== null && (
                                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                                        {transactionCount} records
                                    </span>
                                )}
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition-colors">
                                <Checkbox
                                    checked={includeWallets}
                                    onCheckedChange={(checked) => setIncludeWallets(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="flex-1">
                                    <p className="text-white font-medium">Wallets</p>
                                    <p className="text-xs text-gray-500">Your wallet names, types, and balances</p>
                                </div>
                                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                                    {wallets.length} wallets
                                </span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition-colors">
                                <Checkbox
                                    checked={includeGoals}
                                    onCheckedChange={(checked) => setIncludeGoals(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1">
                                        <p className="text-white font-medium">Goals</p>
                                        <p className="text-xs text-gray-500">Your savings goals and progress</p>
                                    </div>
                                    <Target className="h-4 w-4 text-gray-400" />
                                </div>
                                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                                    {goals?.length || 0} goals
                                </span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition-colors">
                                <Checkbox
                                    checked={includeRecurring}
                                    onCheckedChange={(checked) => setIncludeRecurring(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1">
                                        <p className="text-white font-medium">Recurring Rules</p>
                                        <p className="text-xs text-gray-500">Your active recurring transactions</p>
                                    </div>
                                    <Repeat className="h-4 w-4 text-gray-400" />
                                </div>
                                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                                    {recurringRules.length} rules
                                </span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition-colors">
                                <Checkbox
                                    checked={includeSummary}
                                    onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="flex-1">
                                    <p className="text-white font-medium">Monthly Summary</p>
                                    <p className="text-xs text-gray-500">Aggregated income, expenses, and savings by month</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-2 gap-2 sm:gap-0 pt-4 border-t border-zinc-800">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-gray-400 hover:text-white"
                        disabled={isExporting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        className="bg-primary text-black hover:bg-primary/90 font-bold rounded-xl px-6 gap-2"
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Export {format.toUpperCase()}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
