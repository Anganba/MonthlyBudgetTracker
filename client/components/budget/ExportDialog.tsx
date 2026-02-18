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
import { useLoans } from '@/hooks/use-loans';
import { Download, FileSpreadsheet, FileText, FileJson, Calendar, Loader2, CheckCircle2, Package, Target, Repeat, Banknote } from 'lucide-react';
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
    const { loans } = useLoans();

    const [format, setFormat] = useState<ExportFormat>('excel');
    const [dateRange, setDateRange] = useState<DateRange>('all');
    const [includeTransactions, setIncludeTransactions] = useState(true);
    const [includeWallets, setIncludeWallets] = useState(false);
    const [includeGoals, setIncludeGoals] = useState(false);
    const [includeLoans, setIncludeLoans] = useState(false);
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

    // Helper function to get Goal Name
    const getGoalName = (goalId: string | undefined): string => {
        if (!goalId) return '';
        const goal = goals?.find(g => g.id === goalId);
        return goal ? goal.name : '';
    };

    const formatTime = (dateStr: string, timeStr: string) => {
        if (!timeStr) return '';
        try {
            // Check if timeStr is already a valid date string or just a time
            if (timeStr.includes('T')) {
                return new Date(timeStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            }
            // Combine date and time
            const d = new Date(`${dateStr}T${timeStr}`);
            if (isNaN(d.getTime())) return timeStr; // Fallback to raw string
            return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } catch (e) {
            return timeStr;
        }
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
            const headers = ['Date', 'Time', 'Name', 'Category', 'Amount', 'Type', 'Wallet', 'Destination Wallet', 'Linked Goal'];
            const rows = transactions.map(t => {
                const timestamp = formatTime(t.date, t.timestamp);

                return [
                    t.date,
                    timestamp,
                    t.name,
                    t.category,
                    Math.abs(t.actual).toString(),
                    categorizeTransaction(t),
                    getWalletName(t.walletId),
                    t.toWalletId ? getWalletName(t.toWalletId) : '',
                    t.goalId ? getGoalName(t.goalId) : ''
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

        // Loans CSV
        if (includeLoans && loans && loans.length > 0) {
            const headers = ['Person', 'Type', 'Amount', 'Paid', 'Remaining', 'Description', 'Due Date', 'Status'];
            const rows = loans.map(l => {
                const paidAmount = l.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                const remaining = l.totalAmount - paidAmount;
                const status = remaining <= 0 ? 'Completed' : 'Active';
                return [
                    l.personName,
                    l.direction === 'given' ? 'Lent' : 'Borrowed',
                    l.totalAmount.toString(),
                    paidAmount.toString(),
                    remaining.toString(),
                    l.description || '',
                    l.dueDate ? new Date(l.dueDate).toLocaleDateString() : '',
                    status
                ];
            });
            sections.push('LOANS\n' + headers.join(',') + '\n' + rows.map(row => row.map(escapeCsvField).join(',')).join('\n'));
        }

        return sections.join('\n\n');
    };

    const generateExcel = (transactions: any[]) => {
        const workbook = XLSX.utils.book_new();

        // Transactions Sheet
        if (includeTransactions && transactions.length > 0) {
            const transactionData = transactions.map(t => ({
                Date: t.date,
                Time: formatTime(t.date, t.timestamp),
                Name: t.name,
                Category: t.category,
                Amount: Math.abs(t.actual),
                Type: categorizeTransaction(t),
                Wallet: getWalletName(t.walletId),
                'Destination Wallet': t.toWalletId ? getWalletName(t.toWalletId) : '',
                'Linked Goal': t.goalId ? getGoalName(t.goalId) : ''
            }));
            const wsTransactions = XLSX.utils.json_to_sheet(transactionData);
            wsTransactions['!cols'] = [
                { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
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

        // Loans Sheet
        if (includeLoans && loans && loans.length > 0) {
            const loanData = loans.map(l => {
                const paidAmount = l.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                const remaining = l.totalAmount - paidAmount;
                return {
                    Person: l.personName,
                    Type: l.direction === 'given' ? 'Lent' : 'Borrowed',
                    Amount: l.totalAmount,
                    Paid: paidAmount,
                    Remaining: remaining,
                    Description: l.description || '',
                    'Due Date': l.dueDate ? new Date(l.dueDate).toLocaleDateString() : '',
                    Status: remaining <= 0 ? 'Completed' : 'Active'
                };
            });
            const wsLoans = XLSX.utils.json_to_sheet(loanData);
            wsLoans['!cols'] = [
                { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 10 }
            ];
            XLSX.utils.book_append_sheet(workbook, wsLoans, 'Loans');
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

        if (includeLoans) {
            data.loans = loans?.map(l => {
                const paidAmount = l.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                return {
                    personName: l.personName,
                    direction: l.direction,
                    totalAmount: l.totalAmount,
                    paidAmount,
                    remainingAmount: l.totalAmount - paidAmount,
                    description: l.description,
                    dueDate: l.dueDate,
                    payments: l.payments
                };
            }) || [];
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
        if (!includeTransactions && !includeWallets && !includeSummary && !includeGoals && !includeRecurring && !includeLoans) {
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

            // Log export to audit trail
            const includedDataTypes = [];
            if (includeTransactions) includedDataTypes.push('transactions');
            if (includeWallets) includedDataTypes.push('wallets');
            if (includeGoals) includedDataTypes.push('goals');
            if (includeLoans) includedDataTypes.push('loans');
            if (includeRecurring) includedDataTypes.push('recurring');
            if (includeSummary) includedDataTypes.push('summary');

            try {
                await fetch('/api/audit-logs/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        format,
                        dateRange,
                        includedData: includedDataTypes.join(', ')
                    })
                });
            } catch (logError) {
                console.error('Failed to log export:', logError);
            }

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
            <DialogContent className="sm:max-w-[480px] bg-zinc-900/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto">
                {/* Gradient Header */}
                <div className="bg-gradient-to-b from-orange-500/20 via-amber-500/10 to-transparent p-4 pb-3">
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30">
                                <Download className="h-4 w-4 text-orange-400" />
                            </div>
                            <DialogTitle className="text-base font-semibold text-white">Export Data</DialogTitle>
                        </div>
                        <DialogDescription className="sr-only">
                            Download your financial data in your preferred format.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Form Content */}
                <div className="p-4 pt-3 space-y-4">
                    {/* Format Selection */}
                    <div>
                        <Label className="text-gray-400 text-xs font-medium mb-2 block uppercase tracking-wider">Format</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {formatOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = format === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setFormat(option.value)}
                                        className={`relative p-3 rounded-lg border transition-all text-left group ${isSelected
                                            ? 'border-orange-500/50 bg-orange-500/10'
                                            : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50'
                                            }`}
                                    >
                                        {isSelected && (
                                            <CheckCircle2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-orange-400" />
                                        )}
                                        <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? 'text-orange-400' : 'text-gray-400'}`} />
                                        <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                            {option.label}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{option.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div>
                        <Label className="text-gray-400 text-xs font-medium mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <Calendar className="h-3 w-3" />
                            Date Range
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                            {dateRangeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setDateRange(option.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${dateRange === option.value
                                        ? 'bg-orange-500 text-black'
                                        : 'bg-zinc-800/50 text-gray-400 hover:bg-zinc-700/50 hover:text-white'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Data Selection */}
                    <div>
                        <Label className="text-gray-400 text-xs font-medium mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <Package className="h-3 w-3" />
                            Include Data
                        </Label>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                                <Checkbox
                                    checked={includeTransactions}
                                    onCheckedChange={(checked) => setIncludeTransactions(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 h-4 w-4"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium">Transactions</p>
                                    <p className="text-[10px] text-gray-500">Income, expenses, transfers</p>
                                </div>
                                {transactionCount !== null && (
                                    <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-medium">
                                        {transactionCount}
                                    </span>
                                )}
                            </label>

                            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                                <Checkbox
                                    checked={includeWallets}
                                    onCheckedChange={(checked) => setIncludeWallets(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 h-4 w-4"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium">Wallets</p>
                                    <p className="text-[10px] text-gray-500">Names, types, balances</p>
                                </div>
                                <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-medium">
                                    {wallets.length}
                                </span>
                            </label>

                            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                                <Checkbox
                                    checked={includeGoals}
                                    onCheckedChange={(checked) => setIncludeGoals(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 h-4 w-4"
                                />
                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                    <div>
                                        <p className="text-sm text-white font-medium">Goals</p>
                                        <p className="text-[10px] text-gray-500">Savings goals & progress</p>
                                    </div>
                                    <Target className="h-3.5 w-3.5 text-gray-500" />
                                </div>
                                <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-medium">
                                    {goals?.length || 0}
                                </span>
                            </label>

                            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                                <Checkbox
                                    checked={includeLoans}
                                    onCheckedChange={(checked) => setIncludeLoans(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 h-4 w-4"
                                />
                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                    <div>
                                        <p className="text-sm text-white font-medium">Loans</p>
                                        <p className="text-[10px] text-gray-500">Active loans & history</p>
                                    </div>
                                    <Banknote className="h-3.5 w-3.5 text-gray-500" />
                                </div>
                                <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-medium">
                                    {loans?.length || 0}
                                </span>
                            </label>

                            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                                <Checkbox
                                    checked={includeRecurring}
                                    onCheckedChange={(checked) => setIncludeRecurring(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 h-4 w-4"
                                />
                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                    <div>
                                        <p className="text-sm text-white font-medium">Recurring Rules</p>
                                        <p className="text-[10px] text-gray-500">Active recurring transactions</p>
                                    </div>
                                    <Repeat className="h-3.5 w-3.5 text-gray-500" />
                                </div>
                                <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-medium">
                                    {recurringRules.length}
                                </span>
                            </label>

                            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                                <Checkbox
                                    checked={includeSummary}
                                    onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 h-4 w-4"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium">Monthly Summary</p>
                                    <p className="text-[10px] text-gray-500">Aggregated by month</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="pt-3 gap-2 sm:gap-2 border-t border-white/5">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-gray-400 hover:text-white hover:bg-white/5 h-9 px-4"
                            disabled={isExporting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="h-9 px-5 font-semibold rounded-lg gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-3.5 w-3.5" />
                                    Export {format.toUpperCase()}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog >
    );
}
