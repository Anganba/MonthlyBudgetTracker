import React, { useState, useEffect, useRef } from 'react';
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
import { Printer, Calendar, Loader2, FileText, Receipt, PiggyBank, Wallet, BarChart3, Package } from 'lucide-react';

interface PrintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    month: string;
    year: number;
    transactions?: any[];
}

type DateRange = 'currentMonth' | 'all' | 'last3Months' | 'last6Months' | 'thisYear';

const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: 'currentMonth', label: 'Current Month' },
    { value: 'all', label: 'All Time' },
    { value: 'last3Months', label: 'Last 3 Months' },
    { value: 'last6Months', label: 'Last 6 Months' },
    { value: 'thisYear', label: 'This Year' },
];

export function PrintDialog({ open, onOpenChange, month, year, transactions: propTransactions }: PrintDialogProps) {
    const { toast } = useToast();
    const { wallets } = useWallets();
    const printFrameRef = useRef<HTMLIFrameElement>(null);

    const [dateRange, setDateRange] = useState<DateRange>('currentMonth');
    const [includeTransactions, setIncludeTransactions] = useState(true);
    const [includeWallets, setIncludeWallets] = useState(true);
    const [includeSummary, setIncludeSummary] = useState(true);

    const [isPrinting, setIsPrinting] = useState(false);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [transactionCount, setTransactionCount] = useState<number | null>(null);

    useEffect(() => {
        if (open) {
            fetchTransactions();
        }
    }, [open, dateRange]);

    const getDateRangeStart = (range: DateRange): Date | null => {
        const now = new Date();
        switch (range) {
            case 'currentMonth':
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

    const fetchTransactions = async () => {
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
            console.error('Failed to fetch transactions:', error);
            setTransactionCount(0);
        }
    };

    const categorizeTransaction = (t: any) => {
        const isIncome = ['Paycheck', 'Bonus', 'Debt Added', 'income'].includes(t.category) || t.type === 'income';
        const isSavings = t.category === 'Savings';
        const isTransfer = t.type === 'transfer';

        if (isTransfer) return 'Transfer';
        if (isIncome) return 'Income';
        if (isSavings) return 'Savings';
        return 'Expense';
    };

    const getWalletName = (walletId: string | undefined): string => {
        if (!walletId) return 'N/A';
        const wallet = wallets.find(w => w.id === walletId);
        return wallet ? wallet.name : 'Unknown';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return '$' + Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const generatePrintContent = () => {
        const filteredTransactions = filterTransactions(allTransactions, dateRange);

        // Calculate summary stats
        const totalIncome = filteredTransactions.filter(t => categorizeTransaction(t) === 'Income').reduce((sum, t) => sum + Math.abs(t.actual), 0);
        const totalExpenses = filteredTransactions.filter(t => categorizeTransaction(t) === 'Expense').reduce((sum, t) => sum + Math.abs(t.actual), 0);
        const totalSavings = filteredTransactions.filter(t => categorizeTransaction(t) === 'Savings').reduce((sum, t) => sum + Math.abs(t.actual), 0);
        const netBalance = totalIncome - totalExpenses - totalSavings;

        // Get date range label
        const rangeLabelMap: Record<DateRange, string> = {
            currentMonth: `${month} ${year}`,
            all: 'All Time',
            last3Months: 'Last 3 Months',
            last6Months: 'Last 6 Months',
            thisYear: `Year ${new Date().getFullYear()}`
        };

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Financial Report - Amar Taka Koi</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1a1a1a;
            background: white;
            padding: 40px;
            font-size: 12px;
            line-height: 1.5;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #22c55e;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
        }
        .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
        }
        .report-info {
            text-align: right;
            color: #666;
        }
        .report-info h2 {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 4px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-icon {
            width: 24px;
            height: 24px;
            background: #f3f4f6;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 20px;
        }
        .summary-card {
            padding: 16px;
            border-radius: 10px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
        }
        .summary-card.income { border-left: 4px solid #22c55e; }
        .summary-card.expense { border-left: 4px solid #ef4444; }
        .summary-card.savings { border-left: 4px solid #3b82f6; }
        .summary-card.net { border-left: 4px solid #8b5cf6; }
        .summary-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .summary-value {
            font-size: 20px;
            font-weight: 700;
        }
        .summary-card.income .summary-value { color: #16a34a; }
        .summary-card.expense .summary-value { color: #dc2626; }
        .summary-card.savings .summary-value { color: #2563eb; }
        .summary-card.net .summary-value { color: #7c3aed; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        th {
            background: #f3f4f6;
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        th:last-child, td:last-child {
            text-align: right;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #f3f4f6;
            color: #4b5563;
        }
        tr:hover td {
            background: #fafafa;
        }
        .type-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 500;
            text-transform: capitalize;
        }
        .type-income { background: #dcfce7; color: #166534; }
        .type-expense { background: #fee2e2; color: #991b1b; }
        .type-savings { background: #dbeafe; color: #1e40af; }
        .type-transfer { background: #f3e8ff; color: #6b21a8; }
        .amount-positive { color: #16a34a; font-weight: 600; }
        .amount-negative { color: #1a1a1a; font-weight: 600; }
        .wallets-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }
        .wallet-card {
            padding: 16px;
            border-radius: 10px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
        }
        .wallet-name {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 4px;
        }
        .wallet-type {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .wallet-balance {
            font-size: 18px;
            font-weight: 700;
            color: #22c55e;
            margin-top: 8px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 10px;
        }
        @media print {
            body { padding: 20px; }
            .summary-grid { grid-template-columns: repeat(4, 1fr); }
            .wallets-grid { grid-template-columns: repeat(3, 1fr); }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <div class="logo-icon">৳</div>
            <span class="logo-text">Amar Taka Koi</span>
        </div>
        <div class="report-info">
            <h2>Financial Report</h2>
            <div>${rangeLabelMap[dateRange]}</div>
            <div>Generated: ${new Date().toLocaleDateString()}</div>
        </div>
    </div>

    ${includeSummary ? `
    <div class="section">
        <div class="section-title">
            <div class="section-icon">📊</div>
            Financial Summary
        </div>
        <div class="summary-grid">
            <div class="summary-card income">
                <div class="summary-label">Total Income</div>
                <div class="summary-value">${formatCurrency(totalIncome)}</div>
            </div>
            <div class="summary-card expense">
                <div class="summary-label">Total Expenses</div>
                <div class="summary-value">${formatCurrency(totalExpenses)}</div>
            </div>
            <div class="summary-card savings">
                <div class="summary-label">Total Savings</div>
                <div class="summary-value">${formatCurrency(totalSavings)}</div>
            </div>
            <div class="summary-card net">
                <div class="summary-label">Net Balance</div>
                <div class="summary-value">${formatCurrency(netBalance)}</div>
            </div>
        </div>
    </div>
    ` : ''}

    ${includeWallets && wallets.length > 0 ? `
    <div class="section">
        <div class="section-title">
            <div class="section-icon">💳</div>
            Wallets Overview
        </div>
        <div class="wallets-grid">
            ${wallets.map(w => `
                <div class="wallet-card">
                    <div class="wallet-name">${w.name}</div>
                    <div class="wallet-type">${w.type.replace('_', ' ')}</div>
                    <div class="wallet-balance">${formatCurrency(w.balance)}</div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${includeTransactions && filteredTransactions.length > 0 ? `
    <div class="section">
        <div class="section-title">
            <div class="section-icon">📋</div>
            Transactions (${filteredTransactions.length} records)
        </div>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Wallet</th>
                    <th>Type</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${filteredTransactions.slice(0, 100).map(t => {
            const type = categorizeTransaction(t);
            const typeClass = type.toLowerCase();
            const isIncome = type === 'Income';
            return `
                        <tr>
                            <td>${formatDate(t.date)}</td>
                            <td>${t.name}</td>
                            <td>${t.category}</td>
                            <td>${getWalletName(t.walletId)}</td>
                            <td><span class="type-badge type-${typeClass}">${type}</span></td>
                            <td class="${isIncome ? 'amount-positive' : 'amount-negative'}">${isIncome ? '+' : ''}${formatCurrency(t.actual)}</td>
                        </tr>
                    `;
        }).join('')}
                ${filteredTransactions.length > 100 ? `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #9ca3af; font-style: italic;">
                            ... and ${filteredTransactions.length - 100} more transactions
                        </td>
                    </tr>
                ` : ''}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated by Amar Taka Koi • Personal Budget Tracker</p>
        <p>© ${new Date().getFullYear()} Anganba Singha</p>
    </div>
</body>
</html>
        `;

        return html;
    };

    const handlePrint = () => {
        if (!includeTransactions && !includeWallets && !includeSummary) {
            toast({
                title: "Nothing to Print",
                description: "Please select at least one section to print.",
                variant: "destructive"
            });
            return;
        }

        setIsPrinting(true);

        try {
            const printContent = generatePrintContent();

            // Create a hidden iframe for printing
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.top = '-10000px';
            iframe.style.left = '-10000px';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
                iframeDoc.open();
                iframeDoc.write(printContent);
                iframeDoc.close();

                // Wait for content to load then print
                setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();

                    // Cleanup
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                        setIsPrinting(false);
                        onOpenChange(false);
                    }, 1000);
                }, 500);
            }

        } catch (error) {
            console.error('Print error:', error);
            toast({
                title: "Print Failed",
                description: "An error occurred while preparing the print document.",
                variant: "destructive"
            });
            setIsPrinting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-zinc-900 border-white/10">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/20">
                            <Printer className="h-5 w-5 text-primary" />
                        </div>
                        Print Report
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Generate a professional financial report for printing.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Date Range */}
                    <div className="space-y-3">
                        <Label className="text-gray-400 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Report Period
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

                    {/* Sections to Include */}
                    <div className="space-y-3">
                        <Label className="text-gray-400 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Include Sections
                        </Label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition-colors">
                                <Checkbox
                                    checked={includeSummary}
                                    onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-2 rounded-lg bg-purple-500/20">
                                        <BarChart3 className="h-4 w-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Financial Summary</p>
                                        <p className="text-xs text-gray-500">Income, expenses, savings, and net balance</p>
                                    </div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition-colors">
                                <Checkbox
                                    checked={includeWallets}
                                    onCheckedChange={(checked) => setIncludeWallets(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-2 rounded-lg bg-blue-500/20">
                                        <Wallet className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Wallets Overview</p>
                                        <p className="text-xs text-gray-500">All wallet balances and types</p>
                                    </div>
                                </div>
                                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                                    {wallets.length} wallets
                                </span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 cursor-pointer hover:bg-zinc-800 transition-colors">
                                <Checkbox
                                    checked={includeTransactions}
                                    onCheckedChange={(checked) => setIncludeTransactions(checked as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-2 rounded-lg bg-green-500/20">
                                        <Receipt className="h-4 w-4 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Transaction List</p>
                                        <p className="text-xs text-gray-500">Detailed transaction history</p>
                                    </div>
                                </div>
                                {transactionCount !== null && (
                                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                                        {transactionCount} records
                                    </span>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Print Preview Info */}
                    <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div className="text-sm text-gray-400">
                                <p className="font-medium text-gray-300 mb-1">Print Preview</p>
                                <p>Your report will include a professional header with your branding, selected sections formatted for clear printing, and a footer with generation date.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-2 gap-2 sm:gap-0 pt-4 border-t border-zinc-800">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-gray-400 hover:text-white"
                        disabled={isPrinting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePrint}
                        className="bg-primary text-black hover:bg-primary/90 font-bold rounded-xl px-6 gap-2"
                        disabled={isPrinting}
                    >
                        {isPrinting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Preparing...
                            </>
                        ) : (
                            <>
                                <Printer className="h-4 w-4" />
                                Print Report
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
