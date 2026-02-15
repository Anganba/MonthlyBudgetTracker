import { useState, useMemo, useRef, useEffect } from "react";
import { useLoans } from "@/hooks/use-loans";
import { useWallets } from "@/hooks/use-wallets";
import { Loan } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
    HandCoins,
    Plus,
    ChevronDown,
    ChevronUp,
    MoreVertical,
    Pencil,
    Trash2,
    ArrowUpRight,
    ArrowDownLeft,
    DollarSign,
    Users,
    AlertTriangle,
    CheckCircle2,
    Clock,
    CalendarClock,
    Calendar,
    Banknote,
    Filter,
    Search,
} from "lucide-react";

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

export default function LoansPage() {
    const { loans, isLoading, createLoan, updateLoan, deleteLoan, addPayment, removePayment } = useLoans();
    const { wallets } = useWallets();

    // Dialog states
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<Loan | null>(null);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [expandedLoans, setExpandedLoans] = useState<Set<string>>(new Set());
    const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set(['__all__']));

    // Filter states
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'settled'>('active');
    const [directionFilter, setDirectionFilter] = useState<'all' | 'given' | 'received'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showPersonSuggestions, setShowPersonSuggestions] = useState(false);
    const personInputRef = useRef<HTMLDivElement>(null);

    // Click outside to close person suggestions
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (personInputRef.current && !personInputRef.current.contains(e.target as Node)) {
                setShowPersonSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Add form states
    const [formPersonName, setFormPersonName] = useState('');
    const [formDirection, setFormDirection] = useState<'given' | 'received'>('given');
    const [formAmount, setFormAmount] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formWalletId, setFormWalletId] = useState('');
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formDueDate, setFormDueDate] = useState('');

    // Payment form states
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentWalletId, setPaymentWalletId] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    // Edit form states
    const [editPersonName, setEditPersonName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDueDate, setEditDueDate] = useState('');

    // Filtered loans
    const filteredLoans = useMemo(() => {
        return loans.filter(loan => {
            if (statusFilter !== 'all' && loan.status !== statusFilter) return false;
            if (directionFilter !== 'all' && loan.direction !== directionFilter) return false;
            if (searchQuery && !loan.personName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [loans, statusFilter, directionFilter, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const active = loans.filter(l => l.status === 'active');
        const totalLent = active.filter(l => l.direction === 'given').reduce((s, l) => s + l.remainingAmount, 0);
        const totalBorrowed = active.filter(l => l.direction === 'received').reduce((s, l) => s + l.remainingAmount, 0);
        const overdue = active.filter(l => l.dueDate && new Date(l.dueDate) < new Date()).length;
        const uniquePeople = new Set(active.map(l => l.personName.toLowerCase())).size;
        return { totalLent, totalBorrowed, netBalance: totalLent - totalBorrowed, overdue, uniquePeople };
    }, [loans]);

    // Person-based grouping
    const personGroups = useMemo(() => {
        const groups: Record<string, { loans: Loan[]; totalLent: number; totalBorrowed: number }> = {};
        filteredLoans.forEach(loan => {
            const key = loan.personName.toLowerCase();
            if (!groups[key]) groups[key] = { loans: [], totalLent: 0, totalBorrowed: 0 };
            groups[key].loans.push(loan);
            if (loan.direction === 'given') groups[key].totalLent += loan.remainingAmount;
            else groups[key].totalBorrowed += loan.remainingAmount;
        });
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredLoans]);

    // Unique person names for autocomplete
    const existingPersonNames = useMemo(() => {
        const names = new Set<string>();
        loans.forEach(l => names.add(l.personName));
        return Array.from(names).sort();
    }, [loans]);

    const toggleExpand = (id: string) => {
        setExpandedLoans(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const togglePerson = (personKey: string) => {
        setExpandedPersons(prev => {
            const next = new Set(prev);
            if (next.has(personKey)) next.delete(personKey); else next.add(personKey);
            return next;
        });
    };

    // Initialize all person groups as expanded
    useEffect(() => {
        if (expandedPersons.has('__all__') && personGroups.length > 0) {
            setExpandedPersons(new Set(personGroups.map(([key]) => key)));
        }
    }, [personGroups, expandedPersons]);

    const resetAddForm = () => {
        setFormPersonName('');
        setFormDirection('given');
        setFormAmount('');
        setFormDescription('');
        setFormWalletId('');
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormDueDate('');
    };

    const handleAddLoan = (e: React.FormEvent) => {
        e.preventDefault();
        createLoan.mutate({
            personName: formPersonName,
            direction: formDirection,
            totalAmount: parseFloat(formAmount),
            description: formDescription || undefined,
            walletId: formWalletId || undefined,
            date: formDate,
            dueDate: formDueDate || undefined,
        }, {
            onSuccess: () => { setShowAddDialog(false); resetAddForm(); }
        });
    };

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoan) return;
        addPayment.mutate({
            loanId: selectedLoan.id,
            amount: parseFloat(paymentAmount),
            date: paymentDate,
            walletId: paymentWalletId || undefined,
            note: paymentNote || undefined,
        }, {
            onSuccess: () => {
                setShowPaymentDialog(false);
                setPaymentAmount(''); setPaymentNote(''); setPaymentWalletId('');
                setPaymentDate(new Date().toISOString().split('T')[0]);
            }
        });
    };

    const handleEditLoan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoan) return;
        updateLoan.mutate({
            id: selectedLoan.id,
            personName: editPersonName,
            description: editDescription,
            dueDate: editDueDate || undefined,
        }, {
            onSuccess: () => setShowEditDialog(false)
        });
    };

    const openEdit = (loan: Loan) => {
        setSelectedLoan(loan);
        setEditPersonName(loan.personName);
        setEditDescription(loan.description || '');
        setEditDueDate(loan.dueDate || '');
        setShowEditDialog(true);
    };

    const openPayment = (loan: Loan) => {
        setSelectedLoan(loan);
        setPaymentAmount('');
        setPaymentNote('');
        setPaymentWalletId(loan.walletId || '');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setShowPaymentDialog(true);
    };

    const getDueStatus = (loan: Loan) => {
        if (!loan.dueDate || loan.status === 'settled') return null;
        const due = new Date(loan.dueDate);
        const now = new Date();
        const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return { label: `${Math.abs(daysLeft)}d overdue`, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
        if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
        return { label: `${daysLeft}d left`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    };

    const walletName = (id?: string) => {
        if (!id) return null;
        const w = wallets.find(w => w.id === id);
        return w ? w.name : null;
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                        <HandCoins className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Loans</h1>
                        <p className="text-sm text-gray-400">Track money lent & borrowed</p>
                    </div>
                </div>
                <Button
                    onClick={() => { resetAddForm(); setShowAddDialog(true); }}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25 gap-2"
                >
                    <Plus className="h-4 w-4" /> New Loan
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-500/5 border border-rose-500/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowUpRight className="h-4 w-4 text-rose-400" />
                        <span className="text-xs font-medium text-rose-400 uppercase tracking-wider">Lent Out</span>
                    </div>
                    <p className="text-xl font-bold text-white">${stats.totalLent.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowDownLeft className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Borrowed</span>
                    </div>
                    <p className="text-xl font-bold text-white">${stats.totalBorrowed.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Net Balance</span>
                    </div>
                    <p className={cn("text-xl font-bold", stats.netBalance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {stats.netBalance >= 0 ? '+' : '-'}${Math.abs(stats.netBalance).toLocaleString()}
                    </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">People</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-xl font-bold text-white">{stats.uniquePeople}</p>
                        {stats.overdue > 0 && (
                            <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> {stats.overdue} overdue
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 bg-zinc-800/50 border-zinc-700/50 rounded-lg h-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="w-[130px] bg-zinc-800/50 border-zinc-700/50 rounded-lg h-9 text-sm">
                        <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="settled">Settled</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={directionFilter} onValueChange={(v: any) => setDirectionFilter(v)}>
                    <SelectTrigger className="w-[130px] bg-zinc-800/50 border-zinc-700/50 rounded-lg h-9 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="given">Lent Out</SelectItem>
                        <SelectItem value="received">Borrowed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Loan List - Grouped by Person */}
            {isLoading ? (
                <div className="text-center py-20 text-gray-500">Loading loans...</div>
            ) : personGroups.length === 0 ? (
                <div className="text-center py-20">
                    <HandCoins className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400 text-lg font-medium">No loans found</p>
                    <p className="text-gray-500 text-sm mt-1">
                        {loans.length > 0 ? "Try adjusting your filters" : "Click \"New Loan\" to start tracking"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {personGroups.map(([personKey, group]) => (
                        <div key={personKey} className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
                            {/* Person Header */}
                            <div
                                onClick={() => togglePerson(personKey)}
                                className="flex items-center justify-between px-4 py-3 bg-zinc-800/30 border-b border-white/5 cursor-pointer hover:bg-zinc-800/50 transition-colors select-none"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                                        <span className="text-sm font-bold text-amber-400">{group.loans[0].personName.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-white">{group.loans[0].personName}</span>
                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                            {group.totalLent > 0 && <span className="text-rose-400">Lent: ${group.totalLent.toLocaleString()}</span>}
                                            {group.totalBorrowed > 0 && <span className="text-blue-400">Borrowed: ${group.totalBorrowed.toLocaleString()}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{group.loans.length} loan{group.loans.length > 1 ? 's' : ''}</span>
                                    {expandedPersons.has(personKey)
                                        ? <ChevronUp className="h-4 w-4 text-gray-500" />
                                        : <ChevronDown className="h-4 w-4 text-gray-500" />
                                    }
                                </div>
                            </div>

                            {/* Person's Loans */}
                            {expandedPersons.has(personKey) && (
                                <div className="divide-y divide-white/5">
                                    {group.loans.map(loan => {
                                        const isExpanded = expandedLoans.has(loan.id);
                                        const dueStatus = getDueStatus(loan);
                                        const progress = loan.totalAmount > 0 ? ((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100 : 0;

                                        return (
                                            <div key={loan.id}>
                                                {/* Loan Row */}
                                                <div className="px-4 py-3 flex items-center gap-3 group hover:bg-white/[0.02] transition-colors">
                                                    {/* Direction Icon */}
                                                    <div className={cn(
                                                        "p-2 rounded-lg border shrink-0",
                                                        loan.direction === 'given'
                                                            ? "bg-rose-500/10 border-rose-500/20"
                                                            : "bg-blue-500/10 border-blue-500/20"
                                                    )}>
                                                        {loan.direction === 'given'
                                                            ? <ArrowUpRight className="h-4 w-4 text-rose-400" />
                                                            : <ArrowDownLeft className="h-4 w-4 text-blue-400" />
                                                        }
                                                    </div>

                                                    {/* Loan Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-medium text-white">
                                                                {loan.direction === 'given' ? 'Lent to' : 'Borrowed from'} {loan.personName}
                                                            </span>
                                                            {loan.status === 'settled' && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                                    <CheckCircle2 className="h-2.5 w-2.5" /> Settled
                                                                </span>
                                                            )}
                                                            {dueStatus && (
                                                                <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border", dueStatus.bg, dueStatus.color)}>
                                                                    <CalendarClock className="h-2.5 w-2.5" /> {dueStatus.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                            <span>{new Date(loan.date).toLocaleDateString()}</span>
                                                            {loan.description && <span>• {loan.description}</span>}
                                                            {loan.walletId && walletName(loan.walletId) && (
                                                                <span>• {walletName(loan.walletId)}</span>
                                                            )}
                                                        </div>
                                                        {/* Progress bar */}
                                                        {loan.status === 'active' && (
                                                            <div className="mt-1.5 flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 rounded-full bg-zinc-700/50 overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full rounded-full transition-all duration-500",
                                                                            loan.direction === 'given'
                                                                                ? "bg-gradient-to-r from-rose-500 to-pink-500"
                                                                                : "bg-gradient-to-r from-blue-500 to-cyan-500"
                                                                        )}
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] text-gray-500 shrink-0">{Math.round(progress)}%</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Amount */}
                                                    <div className="text-right shrink-0">
                                                        <p className={cn(
                                                            "text-base font-bold",
                                                            loan.direction === 'given' ? "text-rose-400" : "text-blue-400"
                                                        )}>
                                                            ${loan.totalAmount.toLocaleString()}
                                                        </p>
                                                        {loan.remainingAmount > 0 && loan.remainingAmount < loan.totalAmount && (
                                                            <p className="text-[10px] text-gray-500">
                                                                ${loan.remainingAmount.toLocaleString()} left
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {loan.status === 'active' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openPayment(loan)}
                                                                className="h-8 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                                            >
                                                                <Banknote className="h-3.5 w-3.5 mr-1" />
                                                                {loan.direction === 'given' ? 'Collect' : 'Repay'}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleExpand(loan.id)}
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                                        >
                                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="bg-zinc-800 border-zinc-700" align="end">
                                                                <DropdownMenuItem onClick={() => openEdit(loan)} className="gap-2">
                                                                    <Pencil className="h-3.5 w-3.5" /> Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => setDeleteConfirm(loan)}
                                                                    className="gap-2 text-red-400 focus:text-red-400"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>

                                                {/* Expanded Payment History */}
                                                {isExpanded && (
                                                    <div className="px-4 pb-3 bg-zinc-800/20">
                                                        <div className="ml-10 border-l-2 border-zinc-700/50 pl-4 space-y-2 py-2">
                                                            {loan.payments.length === 0 ? (
                                                                <p className="text-xs text-gray-500 italic">No payments recorded yet</p>
                                                            ) : (
                                                                loan.payments.map(payment => (
                                                                    <div key={payment.id} className="flex items-center justify-between group/payment">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                                            <span className="text-xs text-gray-300">${payment.amount.toLocaleString()}</span>
                                                                            <span className="text-[10px] text-gray-500">{new Date(payment.date).toLocaleDateString()}</span>
                                                                            {payment.note && <span className="text-[10px] text-gray-500">— {payment.note}</span>}
                                                                            {payment.walletId && walletName(payment.walletId) && (
                                                                                <span className="text-[10px] text-gray-600">via {walletName(payment.walletId)}</span>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => removePayment.mutate({ loanId: loan.id, paymentId: payment.id })}
                                                                            className="h-6 w-6 p-0 opacity-0 group-hover/payment:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-opacity"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Loan Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-[420px] bg-zinc-900/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden shadow-2xl">
                    <div className={cn("bg-gradient-to-b p-4 pb-3", formDirection === 'given' ? "from-rose-500/15 via-pink-500/5 to-transparent" : "from-blue-500/15 via-cyan-500/5 to-transparent")}>
                        <DialogHeader className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className={cn("p-1.5 rounded-lg border", formDirection === 'given' ? "bg-rose-500/10 border-rose-500/30" : "bg-blue-500/10 border-blue-500/30")}>
                                    <HandCoins className={cn("h-4 w-4", formDirection === 'given' ? "text-rose-400" : "text-blue-400")} />
                                </div>
                                <DialogTitle className="text-base font-semibold text-white">New Loan</DialogTitle>
                            </div>
                            <DialogDescription className="sr-only">Create a new loan entry</DialogDescription>
                        </DialogHeader>

                        {/* Direction Toggle */}
                        <div className="flex mt-3 bg-black/30 rounded-lg p-0.5 border border-white/5">
                            <button
                                type="button"
                                onClick={() => setFormDirection('given')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all",
                                    formDirection === 'given'
                                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg"
                                        : "text-gray-400 hover:text-gray-300"
                                )}
                            >
                                <ArrowUpRight className="h-3 w-3" /> Lending
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormDirection('received')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all",
                                    formDirection === 'received'
                                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                                        : "text-gray-400 hover:text-gray-300"
                                )}
                            >
                                <ArrowDownLeft className="h-3 w-3" /> Borrowing
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleAddLoan} className="p-4 pt-2 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div ref={personInputRef} className="relative">
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Person Name</Label>
                                <Input
                                    value={formPersonName}
                                    onChange={e => { setFormPersonName(e.target.value); setShowPersonSuggestions(true); }}
                                    onFocus={() => setShowPersonSuggestions(true)}
                                    placeholder="e.g. John Doe"
                                    required
                                    autoFocus
                                    autoComplete="off"
                                    className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10"
                                />
                                {showPersonSuggestions && existingPersonNames.filter(n => n.toLowerCase().includes(formPersonName.toLowerCase()) && n.toLowerCase() !== formPersonName.toLowerCase()).length > 0 && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700/70 rounded-lg shadow-xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                        {existingPersonNames
                                            .filter(n => n.toLowerCase().includes(formPersonName.toLowerCase()) && n.toLowerCase() !== formPersonName.toLowerCase())
                                            .map(name => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => { setFormPersonName(name); setShowPersonSuggestions(false); }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors text-left"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                                                        <span className="text-[10px] font-bold text-amber-400">{name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                    {name}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Amount</Label>
                                <div className="relative">
                                    <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium", formDirection === 'given' ? "text-rose-400" : "text-blue-400")}>$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={formAmount}
                                        onChange={e => setFormAmount(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 pl-7"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Description (Optional)</Label>
                            <Input
                                value={formDescription}
                                onChange={e => setFormDescription(e.target.value)}
                                placeholder="e.g. For rent payment"
                                className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10"
                            />
                        </div>

                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Wallet</Label>
                            <Select value={formWalletId} onValueChange={setFormWalletId}>
                                <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 w-full [&>span]:line-clamp-none [&>span]:block [&>span]:truncate">
                                    <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="none">None</SelectItem>
                                    {wallets.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Date</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={formDate}
                                        onChange={e => setFormDate(e.target.value)}
                                        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                        className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 cursor-pointer text-sm pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Due Date</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={formDueDate}
                                        onChange={e => setFormDueDate(e.target.value)}
                                        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                        className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 cursor-pointer text-sm pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-2 gap-2 sm:gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowAddDialog(false)}
                                className="text-gray-400 hover:text-white hover:bg-white/5 h-9 px-4">Cancel</Button>
                            <Button
                                type="submit"
                                disabled={createLoan.isPending}
                                className={cn(
                                    "h-9 min-w-[160px] px-5 font-semibold rounded-lg shadow-lg transition-all hover:opacity-90 active:scale-[0.98]",
                                    formDirection === 'given'
                                        ? "bg-gradient-to-r from-rose-500 to-pink-500 shadow-rose-500/25 text-white"
                                        : "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/25 text-white"
                                )}
                            >
                                {createLoan.isPending ? "Creating..." : formDirection === 'given' ? "Record Lending" : "Record Borrowing"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="sm:max-w-[380px] bg-zinc-900/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden shadow-2xl">
                    <div className="bg-gradient-to-b from-emerald-500/15 via-green-500/5 to-transparent p-4 pb-3">
                        <DialogHeader className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                    <Banknote className="h-4 w-4 text-emerald-400" />
                                </div>
                                <DialogTitle className="text-base font-semibold text-white">
                                    {selectedLoan?.direction === 'given' ? 'Collect Payment' : 'Record Repayment'}
                                </DialogTitle>
                            </div>
                            <DialogDescription className="sr-only">Record a payment for this loan</DialogDescription>
                        </DialogHeader>
                        {selectedLoan && (
                            <p className="text-xs text-gray-400 mt-2">
                                {selectedLoan.direction === 'given' ? 'Collecting from' : 'Repaying to'}{' '}
                                <span className="text-white font-medium">{selectedLoan.personName}</span>
                                {' '}• Remaining: <span className="text-emerald-400 font-medium">${selectedLoan.remainingAmount.toLocaleString()}</span>
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleAddPayment} className="p-4 pt-2 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-emerald-400">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={selectedLoan?.remainingAmount}
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        autoFocus
                                        className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 pl-7"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Date</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={paymentDate}
                                        onChange={e => setPaymentDate(e.target.value)}
                                        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                        className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 cursor-pointer text-sm pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Wallet</Label>
                                <Select value={paymentWalletId} onValueChange={setPaymentWalletId}>
                                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 [&>span]:line-clamp-none [&>span]:block [&>span]:truncate">
                                        <SelectValue placeholder="Optional" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        <SelectItem value="none">None</SelectItem>
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Note</Label>
                                <Input
                                    value={paymentNote}
                                    onChange={e => setPaymentNote(e.target.value)}
                                    placeholder="Optional"
                                    className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10"
                                />
                            </div>
                        </div>
                        {selectedLoan && paymentAmount && (
                            <div className="text-xs text-gray-500 bg-zinc-800/30 rounded-lg px-3 py-2 border border-white/5">
                                {parseFloat(paymentAmount) >= selectedLoan.remainingAmount
                                    ? <span className="text-emerald-400 font-medium">✓ This will settle the loan completely</span>
                                    : <span>After payment: <span className="text-white">${(selectedLoan.remainingAmount - parseFloat(paymentAmount)).toLocaleString()}</span> remaining</span>
                                }
                            </div>
                        )}
                        <DialogFooter className="pt-1 gap-2 sm:gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowPaymentDialog(false)}
                                className="text-gray-400 hover:text-white hover:bg-white/5 h-9 px-4">Cancel</Button>
                            <Button
                                type="submit"
                                disabled={addPayment.isPending}
                                className="h-9 px-5 font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/25 text-white"
                            >
                                {addPayment.isPending ? "Recording..." : selectedLoan?.direction === 'given' ? "Collect Payment" : "Record Repayment"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Loan Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-[380px] bg-zinc-900/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden shadow-2xl">
                    <div className="bg-gradient-to-b from-amber-500/15 via-orange-500/5 to-transparent p-4 pb-3">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="text-base font-semibold text-white">Edit Loan</DialogTitle>
                            <DialogDescription className="sr-only">Edit loan details</DialogDescription>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleEditLoan} className="p-4 pt-2 space-y-3">
                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Person Name</Label>
                            <Input
                                value={editPersonName}
                                onChange={e => setEditPersonName(e.target.value)}
                                required
                                className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Description</Label>
                            <Input
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-400 text-xs font-medium mb-1.5 block">Due Date</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={editDueDate}
                                    onChange={e => setEditDueDate(e.target.value)}
                                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                    className="bg-zinc-800/50 border-zinc-700/50 rounded-lg h-10 cursor-pointer text-sm pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <DialogFooter className="pt-1 gap-2 sm:gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowEditDialog(false)}
                                className="text-gray-400 hover:text-white hover:bg-white/5 h-9 px-4">Cancel</Button>
                            <Button
                                type="submit"
                                disabled={updateLoan.isPending}
                                className="h-9 px-5 font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25 text-white"
                            >
                                {updateLoan.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent className="bg-zinc-900 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Loan?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            This will permanently delete the loan record for <span className="text-white font-medium">{deleteConfirm?.personName}</span> ($
                            {deleteConfirm?.totalAmount.toLocaleString()}).
                            {deleteConfirm?.status === 'active' && deleteConfirm?.walletId && (
                                <span className="block mt-1 text-amber-400">
                                    The remaining ${deleteConfirm.remainingAmount.toLocaleString()} will be returned to your wallet.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-gray-300 hover:bg-zinc-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => { if (deleteConfirm) { deleteLoan.mutate(deleteConfirm.id); setDeleteConfirm(null); } }}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
