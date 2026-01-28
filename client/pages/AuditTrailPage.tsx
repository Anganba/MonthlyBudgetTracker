import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { AuditLog } from '@shared/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, History, Wallet, Target, Repeat, Receipt, Clock, ChevronLeft, ChevronRight, Calendar, User } from "lucide-react";
import { format, addMonths, subMonths } from 'date-fns';
import { cn } from "@/lib/utils";

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function AuditTrailPage() {
    const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [currency, setCurrency] = useState('USD');

    const [searchTerm, setSearchTerm] = useState('');
    const [entityFilter, setEntityFilter] = useState('all');
    const [changeTypeFilter, setChangeTypeFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof AuditLog; direction: 'asc' | 'desc' } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleMonthChange = (newMonth: string, newYear: number) => {
        setMonth(newMonth);
        setYear(newYear);
    };

    const handlePrevMonth = () => {
        const currentDate = new Date(year, MONTHS.indexOf(month), 1);
        const prevDate = subMonths(currentDate, 1);
        setMonth(MONTHS[prevDate.getMonth()]);
        setYear(prevDate.getFullYear());
    };

    const handleNextMonth = () => {
        const currentDate = new Date(year, MONTHS.indexOf(month), 1);
        const nextDate = addMonths(currentDate, 1);
        setMonth(MONTHS[nextDate.getMonth()]);
        setYear(nextDate.getFullYear());
    };

    // Fetch audit logs
    const { data: auditLogs = [], isLoading, refetch } = useQuery<AuditLog[]>({
        queryKey: ['audit-logs', month, year, entityFilter, changeTypeFilter],
        queryFn: async () => {
            const monthIndex = MONTHS.indexOf(month);
            const startDate = new Date(year, monthIndex, 1).toISOString();
            const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).toISOString();

            const params = new URLSearchParams({
                startDate,
                endDate,
                limit: '500' // Fetch all relevant logs for the month
            });

            if (entityFilter !== 'all') params.append('entityType', entityFilter);
            if (changeTypeFilter !== 'all') params.append('changeType', changeTypeFilter);

            const res = await fetch(`/api/audit-logs?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch audit logs');
            const json = await res.json();
            return json.data || [];
        },
    });

    const getEntityIcon = (entityType: string) => {
        switch (entityType) {
            case 'wallet': return Wallet;
            case 'goal': return Target;
            case 'recurring': return Repeat;
            case 'transaction': return Receipt;
            case 'profile': return User;
            default: return History;
        }
    };

    const getEntityColor = (entityType: string) => {
        switch (entityType) {
            case 'wallet': return { color: 'text-blue-400', bg: 'bg-blue-500/20' };
            case 'goal': return { color: 'text-purple-400', bg: 'bg-purple-500/20' };
            case 'recurring': return { color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
            case 'transaction': return { color: 'text-amber-400', bg: 'bg-amber-500/20' };
            case 'profile': return { color: 'text-pink-400', bg: 'bg-pink-500/20' };
            default: return { color: 'text-gray-400', bg: 'bg-gray-500/20' };
        }
    };

    const getChangeTypeLabel = (changeType: string) => {
        return changeType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getChangeTypeColor = (changeType: string) => {
        if (changeType.includes('created')) return 'text-green-400 bg-green-500/20';
        if (changeType.includes('deleted')) return 'text-red-400 bg-red-500/20';
        if (changeType.includes('updated') || changeType.includes('change')) return 'text-yellow-400 bg-yellow-500/20';
        if (changeType.includes('fulfilled') || changeType.includes('reactivated')) return 'text-purple-400 bg-purple-500/20';
        if (changeType.includes('reset')) return 'text-orange-400 bg-orange-500/20';
        if (changeType === 'password_changed') return 'text-pink-400 bg-pink-500/20';
        if (changeType === 'data_exported') return 'text-cyan-400 bg-cyan-500/20';
        return 'text-gray-400 bg-gray-500/20';
    };

    // Format details from JSON to human-readable text
    const formatDetails = (log: AuditLog): string => {
        // If it's a balance change, include the reason and balance updates if available
        if (log.changeType === 'balance_change') {
            const balanceInfo = (log.previousBalance !== undefined && log.newBalance !== undefined)
                ? ` ($${log.previousBalance} ➝ $${log.newBalance})`
                : '';

            if (log.reason) {
                return `${log.reason}${balanceInfo}`;
            }
        }

        // If no details, return empty
        if (!log.details) return '-';

        // Try to parse JSON details
        try {
            const parsed = JSON.parse(log.details);

            // Format based on entity type and change type
            if (log.entityType === 'transaction') {
                const parts: string[] = [];
                if (parsed.type) parts.push(parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1));
                if (parsed.category) parts.push(`Category: ${parsed.category}`);
                if (parsed.date) parts.push(`Date: ${parsed.date}`);
                return parts.length > 0 ? parts.join(' • ') : log.details;
            }

            if (log.entityType === 'wallet') {
                const parts: string[] = [];
                if (parsed.type) parts.push(`Type: ${parsed.type}`);
                if (parsed.balance !== undefined) parts.push(`Balance: $${parsed.balance}`);
                return parts.length > 0 ? parts.join(' • ') : log.details;
            }

            if (log.entityType === 'goal') {
                const parts: string[] = [];
                if (parsed.targetAmount) parts.push(`Target: $${parsed.targetAmount}`);
                if (parsed.status) parts.push(`Status: ${parsed.status}`);
                return parts.length > 0 ? parts.join(' • ') : log.details;
            }

            if (log.entityType === 'recurring') {
                const parts: string[] = [];
                if (parsed.frequency) parts.push(`${parsed.frequency}`);
                if (parsed.amount) parts.push(`$${parsed.amount}`);
                if (parsed.type) parts.push(parsed.type);
                return parts.length > 0 ? parts.join(' • ') : log.details;
            }

            // Generic fallback - show key info
            const keys = Object.keys(parsed).slice(0, 3);
            if (keys.length > 0) {
                return keys.map(k => `${k}: ${parsed[k]}`).join(' • ');
            }
        } catch {
            // Not JSON, return as-is
            return log.details;
        }

        return log.details || '-';
    };

    // Client-side search (still useful for searching within the fetched month's data)
    const filteredLogs = React.useMemo(() => {
        if (!searchTerm) return auditLogs;

        const lowerSearch = searchTerm.toLowerCase();

        return auditLogs.filter(log => {
            // Check formatted details (what the user sees)
            const formattedDetails = formatDetails(log).toLowerCase();
            if (formattedDetails.includes(lowerSearch)) return true;

            // Check basic text fields
            if (log.entityName.toLowerCase().includes(lowerSearch)) return true;
            if (log.changeType.toLowerCase().includes(lowerSearch)) return true;
            if (log.details?.toLowerCase().includes(lowerSearch)) return true;
            if (log.reason?.toLowerCase().includes(lowerSearch)) return true;

            // Check numeric fields
            if (log.changeAmount !== undefined && log.changeAmount.toString().includes(searchTerm)) return true;
            if (log.previousBalance !== undefined && log.previousBalance.toString().includes(searchTerm)) return true;
            if (log.newBalance !== undefined && log.newBalance.toString().includes(searchTerm)) return true;

            return false;
        });
    }, [auditLogs, searchTerm]);

    // Sort logs
    const sortedLogs = [...filteredLogs].sort((a, b) => {
        if (!sortConfig) {
            // Default sort: by timestamp descending
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
        if (sortConfig.key === 'timestamp') {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // Special handling for Amount: sort by absolute value
        if (sortConfig.key === 'changeAmount') {
            const valA = Math.abs(a.changeAmount || 0);
            const valB = Math.abs(b.changeAmount || 0);
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue! < bValue!) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue! > bValue!) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination
    const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
    const paginatedLogs = sortedLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, entityFilter, changeTypeFilter, month, year]);

    const requestSort = (key: keyof AuditLog) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Get unique change types for filter (from current month's logs)
    const changeTypes = Array.from(new Set(filteredLogs.map(log => log.changeType))).sort();

    // Stats for current month
    const monthStats = {
        total: filteredLogs.length,
        transactions: filteredLogs.filter(l => l.entityType === 'transaction').length,
        wallets: filteredLogs.filter(l => l.entityType === 'wallet').length,
        goals: filteredLogs.filter(l => l.entityType === 'goal').length
    };

    return (
        <div className="min-h-screen bg-background text-white relative overflow-hidden">
            {/* Animated background decorations */}
            <div className="hidden md:block absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="hidden md:block absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
            <div className="hidden md:block absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="hidden md:block absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />

            <div className="p-4 md:p-6 lg:p-8 relative z-10">
                {/* Header - Dashboard Style */}
                <div className="flex flex-col gap-4 mb-6 md:mb-8">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Title */}
                        <div className="flex-shrink-0">
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold font-serif text-white">Audit Trail</h1>
                            <p className="text-gray-500 text-[10px] md:text-xs mt-0.5 hidden sm:block">Track all activities and changes in your account</p>
                        </div>

                        {/* Right: Date Navigator - Matching Transactions Page */}
                        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                            <div className="flex items-center bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-white/10 p-1.5">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handlePrevMonth}
                                    className="h-9 w-9 hover:bg-primary hover:text-black transition-all rounded-xl"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="font-semibold text-white min-w-[150px] text-center flex items-center justify-center gap-2 px-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    {month} {year}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleNextMonth}
                                    className="h-9 w-9 hover:bg-primary hover:text-black transition-all rounded-xl"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="group rounded-2xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-blue-500/5 border border-cyan-500/30 p-6 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 shadow-inner">
                                <History className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-sm text-cyan-300/70">Total Activities</p>
                                <p className="text-2xl font-bold text-white">{monthStats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-2xl bg-gradient-to-br from-green-500/20 via-green-500/10 to-emerald-500/5 border border-green-500/30 p-6 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/20 shadow-inner">
                                <Receipt className="h-6 w-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-green-300/70">Transaction Events</p>
                                <p className="text-2xl font-bold text-green-400">{monthStats.transactions}</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-2xl bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-indigo-500/5 border border-blue-500/30 p-6 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/20 shadow-inner">
                                <Wallet className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-300/70">Wallet Events</p>
                                <p className="text-2xl font-bold text-blue-400">{monthStats.wallets}</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-2xl bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-violet-500/5 border border-purple-500/30 p-6 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/30 to-violet-500/20 shadow-inner">
                                <Target className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-300/70">Goal Events</p>
                                <p className="text-2xl font-bold text-purple-400">{monthStats.goals}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-2xl bg-gradient-to-r from-cyan-500/10 via-zinc-900/80 to-zinc-900/50 border border-cyan-500/30 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center shadow-lg shadow-cyan-500/5">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search by name, details, or event type..."
                            className="pl-11 h-11 bg-zinc-800 border-zinc-700 rounded-xl focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <Select value={entityFilter} onValueChange={setEntityFilter}>
                            <SelectTrigger className="w-[150px] h-11 bg-zinc-800 border-zinc-700 rounded-xl">
                                <SelectValue placeholder="All Entities" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="all">All Entities</SelectItem>
                                <SelectItem value="transaction">Transactions</SelectItem>
                                <SelectItem value="wallet">Wallets</SelectItem>
                                <SelectItem value="goal">Goals</SelectItem>
                                <SelectItem value="recurring">Recurring</SelectItem>
                                <SelectItem value="profile">Profile</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
                            <SelectTrigger className="w-[180px] h-11 bg-zinc-800 border-zinc-700 rounded-xl">
                                <SelectValue placeholder="All Events" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="all">All Events</SelectItem>
                                {changeTypes.map(ct => (
                                    <SelectItem key={ct} value={ct}>{getChangeTypeLabel(ct)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 via-zinc-900/80 to-zinc-900/50 border border-cyan-500/30 overflow-hidden shadow-lg shadow-cyan-500/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm table-fixed">
                            <thead>
                                <tr className="bg-gradient-to-r from-cyan-500/10 to-transparent border-b border-cyan-500/20">
                                    <th className="text-left py-4 px-4 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors w-[180px]" onClick={() => requestSort('timestamp')}>
                                        <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors w-[200px]" onClick={() => requestSort('entityName')}>
                                        <div className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-400 w-[130px]" onClick={() => requestSort('entityType')}>
                                        <div className="flex items-center gap-1">Entity <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-400 w-[180px]" onClick={() => requestSort('changeType')}>
                                        <div className="flex items-center gap-1">Event <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-400 w-[250px]">Details</th>
                                    <th className="text-right py-4 px-4 font-medium text-gray-400 cursor-pointer hover:text-white transition-colors w-[120px]" onClick={() => requestSort('changeAmount')}>
                                        <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading...</td></tr>
                                ) : paginatedLogs.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-gray-500">No audit logs found.</td></tr>
                                ) : (
                                    paginatedLogs.map((log) => {
                                        const EntityIcon = getEntityIcon(log.entityType);
                                        const entityColor = getEntityColor(log.entityType);
                                        return (
                                            <tr key={log.id} className="border-b border-white/5 hover:bg-cyan-500/5 transition-colors">
                                                <td className="py-4 px-4 text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                                                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 font-medium text-white">{log.entityName}</td>
                                                <td className="py-4 px-4">
                                                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize", entityColor.bg, entityColor.color)}>
                                                        <EntityIcon className="h-3 w-3" />
                                                        {log.entityType}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", getChangeTypeColor(log.changeType))}>
                                                        {getChangeTypeLabel(log.changeType)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-gray-400 text-xs truncate max-w-[250px]" title={formatDetails(log)}>
                                                    {formatDetails(log)}
                                                </td>
                                                <td className="py-4 px-4 text-right font-semibold text-white">
                                                    {log.changeAmount !== undefined ? `$${log.changeAmount.toFixed(2)}` : '-'}
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
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-4">
                            <span>
                                Showing {paginatedLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, sortedLogs.length)} of {sortedLogs.length}
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
        </div>
    );
}

export default AuditTrailPage;
