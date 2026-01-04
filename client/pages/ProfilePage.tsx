import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User, LogOut, Shield, Mail, Loader2, Edit,
    ChevronRight, Linkedin, Github, Briefcase, Sparkles, Crown, Key, UserCircle,
    Zap, Heart, Download, BarChart3, Target, TrendingUp, Clock, CheckCircle,
    History, ChevronLeft, Search, Filter, FileText, Trophy, RefreshCw, Plus, Trash2, Wallet, Repeat
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useBudget } from "@/hooks/use-budget";
import { useWallets } from "@/hooks/use-wallets";
import { useAudit } from "@/hooks/use-wallet-audit";
import { AuditEntityType } from "@shared/api";
import { useGoals } from "@/hooks/use-goals";
import { ExportDialog } from "@/components/budget/ExportDialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ProfilePage() {
    const { user, logout, updateProfile, updatePassword } = useAuth();
    const { toast } = useToast();
    const { stats, budget } = useBudget();
    const { wallets } = useWallets();
    const { goals } = useGoals();

    // Dialog States
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

    // Form States
    const [profileForm, setProfileForm] = useState({ username: "", email: "" });
    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
    // Audit Trail States
    const [isAuditExpanded, setIsAuditExpanded] = useState(false);
    const [auditEntityFilter, setAuditEntityFilter] = useState<string>("all");
    const [auditSearchTerm, setAuditSearchTerm] = useState("");
    const [auditPage, setAuditPage] = useState(0);
    const auditPageSize = 20;

    // Fetch audit logs
    const { auditLogs, isLoading: isAuditLoading } = useAudit({
        entityType: auditEntityFilter === "all" ? undefined : auditEntityFilter as AuditEntityType,
        limit: auditPageSize,
        offset: auditPage * auditPageSize
    });

    // Filter audit logs by search term
    const filteredAuditLogs = auditLogs.filter(log =>
        log.entityName.toLowerCase().includes(auditSearchTerm.toLowerCase())
    );

    const totalAuditPages = Math.ceil((auditLogs.length < auditPageSize ? auditLogs.length : auditPageSize * (auditPage + 2)) / auditPageSize);

    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        await logout();
    };

    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase();
    };

    // Open Helpers
    const openEditProfile = () => {
        setProfileForm({ username: user?.username || "", email: user?.email || "" });
        setIsEditProfileOpen(true);
    };

    const openChangePassword = () => {
        setPasswordForm({ current: "", new: "", confirm: "" });
        setIsChangePasswordOpen(true);
    };

    // Handlers
    const handleUpdateProfile = async () => {
        if (!profileForm.username) return;
        setIsLoading(true);
        try {
            await updateProfile({ username: profileForm.username, email: profileForm.email });
            toast({ title: "Profile updated", description: "Your details have been saved." });
            setIsEditProfileOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.new !== passwordForm.confirm) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            await updatePassword(passwordForm.current, passwordForm.new);
            toast({ title: "Success", description: "Password updated successfully." });
            setIsChangePasswordOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };


    // Calculate statistics
    const totalTransactions = budget?.transactions?.length || 0;
    const totalWallets = wallets?.length || 0;
    const completedGoals = goals?.filter(g => g.status === 'fulfilled')?.length || 0;
    const activeGoals = goals?.filter(g => g.status === 'active')?.length || 0;
    const thisMonthSpent = stats.expenses || 0;
    const savingsRate = stats.income > 0 ? Math.round((stats.savings / stats.income) * 100) : 0;

    const proFeatures = [
        "Unlimited wallets & transactions",
        "Advanced analytics & reports",
        "Data export (CSV, PDF)",
        "Priority support",
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-8 relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="hidden md:block absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="hidden md:block absolute bottom-20 left-20 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
            <div className="hidden md:block absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-gradient-to-tl from-emerald-500/10 via-green-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="hidden md:block absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />

            {/* Header */}
            <div className="relative z-10 mb-8">
                <h1 className="text-4xl font-bold font-serif text-white">Profile</h1>
                <p className="text-gray-400 mt-1">Manage your account settings and preferences</p>
            </div>

            <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                {/* Profile Header Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500/15 via-zinc-900/90 to-zinc-900/80 border border-violet-500/30 p-8 shadow-lg shadow-violet-500/5">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                        {/* Avatar with gradient ring */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-xl scale-110 opacity-50" />
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full p-1">
                                <div className="w-full h-full bg-zinc-900 rounded-full" />
                            </div>
                            <Avatar className="h-32 w-32 border-4 border-transparent relative shadow-2xl" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)' }}>
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500/30 to-purple-500/20 text-violet-300 text-4xl font-bold">
                                    {user?.username ? getInitials(user.username) : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                onClick={openEditProfile}
                                className="absolute bottom-0 right-0 p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center lg:text-left space-y-3">
                            <div>
                                <h2 className="text-3xl font-bold font-serif text-white">
                                    {user?.username}
                                </h2>
                                <p className="text-gray-400 flex items-center justify-center lg:justify-start gap-2 mt-1">
                                    <Mail className="h-4 w-4" />
                                    {user?.email || "No email set"}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 px-4 py-1.5 text-sm font-semibold text-violet-300">
                                    <Sparkles className="h-4 w-4" />
                                    Free Plan
                                </span>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Member since {new Date().getFullYear()}
                                </span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <Button
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="group rounded-xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/30 p-4 shadow-lg shadow-cyan-500/5 hover:shadow-cyan-500/10 hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/20 shadow-inner">
                                <BarChart3 className="h-5 w-5 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-xs text-cyan-300/70">This Month</p>
                                <p className="text-xl font-bold text-white">${thisMonthSpent.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 p-4 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/30 to-green-500/20 shadow-inner">
                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-emerald-300/70">Savings Rate</p>
                                <p className="text-xl font-bold text-emerald-400">{savingsRate}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-xl bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-transparent border border-violet-500/30 p-4 shadow-lg shadow-violet-500/5 hover:shadow-violet-500/10 hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/30 to-purple-500/20 shadow-inner">
                                <Target className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-xs text-violet-300/70">Active Goals</p>
                                <p className="text-xl font-bold text-white">{activeGoals}</p>
                            </div>
                        </div>
                    </div>
                    <div className="group rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 p-4 shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10 hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/30 to-yellow-500/20 shadow-inner">
                                <CheckCircle className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs text-amber-300/70">Goals Done</p>
                                <p className="text-xl font-bold text-amber-400">{completedGoals}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Statistics */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-zinc-900/80 to-zinc-900/50 border border-emerald-500/30 p-6 shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/20 shadow-inner">
                            <BarChart3 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Account Statistics</h3>
                            <p className="text-sm text-emerald-300/60">Your activity summary</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-2xl font-bold text-white">{totalTransactions}</p>
                            <p className="text-sm text-gray-400">Transactions</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-2xl font-bold text-white">{totalWallets}</p>
                            <p className="text-sm text-gray-400">Wallets</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-2xl font-bold text-white">{activeGoals}</p>
                            <p className="text-sm text-gray-400">Active Goals</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-2xl font-bold text-emerald-400">{completedGoals}</p>
                            <p className="text-sm text-gray-400">Goals Achieved</p>
                        </div>
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Account Settings */}
                    <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 via-zinc-900/80 to-zinc-900/50 border border-cyan-500/30 p-6 space-y-4 shadow-lg shadow-cyan-500/5 hover:shadow-cyan-500/10 transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 shadow-inner">
                                <UserCircle className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Account Settings</h3>
                                <p className="text-sm text-cyan-300/60">Manage your profile information</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={openEditProfile}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                                    <div className="text-left">
                                        <p className="font-medium text-white">Profile Information</p>
                                        <p className="text-sm text-gray-500">Update username and email</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 via-zinc-900/80 to-zinc-900/50 border border-violet-500/30 p-6 space-y-4 shadow-lg shadow-violet-500/5 hover:shadow-violet-500/10 transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 shadow-inner">
                                <Shield className="h-6 w-6 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Security</h3>
                                <p className="text-sm text-violet-300/60">Keep your account safe</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={openChangePassword}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/30 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Key className="h-5 w-5 text-gray-400 group-hover:text-violet-400 transition-colors" />
                                    <div className="text-left">
                                        <p className="font-medium text-white">Password</p>
                                        <p className="text-sm text-gray-500">Change your password</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Management - Full Width */}
                <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 via-zinc-900/80 to-zinc-900/50 border border-orange-500/30 p-6 space-y-4 shadow-lg shadow-orange-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/20 shadow-inner">
                                <Download className="h-6 w-6 text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Data Management</h3>
                                <p className="text-sm text-orange-300/60">Download your financial data in your preferred format</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsExportDialogOpen(true)}
                            className="bg-gradient-to-r from-[#84CC16] to-[#65A30D] text-black font-semibold hover:opacity-90 shadow-lg shadow-lime-500/20"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                    </div>
                </div>

                {/* Audit Trail Section */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 via-zinc-900/80 to-zinc-900/50 border border-blue-500/30 p-6 space-y-4 shadow-lg shadow-blue-500/5">
                    <button
                        onClick={() => setIsAuditExpanded(!isAuditExpanded)}
                        className="w-full flex items-center justify-between hover:bg-white/5 -m-2 p-2 rounded-xl transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 shadow-inner">
                                <History className="h-6 w-6 text-blue-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-semibold text-white">Audit Trail</h3>
                                <p className="text-sm text-blue-300/60">Track all activities and changes in your account</p>
                            </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-blue-400 transition-transform ${isAuditExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {isAuditExpanded && (
                        <>
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <Select value={auditEntityFilter} onValueChange={setAuditEntityFilter}>
                                        <SelectTrigger className="h-10 bg-zinc-800 border-zinc-700 focus:border-blue-400">
                                            <SelectValue placeholder="All Activities" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            <SelectItem value="all">All Activities</SelectItem>
                                            <SelectItem value="wallet">Wallets</SelectItem>
                                            <SelectItem value="goal">Goals</SelectItem>
                                            <SelectItem value="recurring">Recurring Rules</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder="Search by name..."
                                        value={auditSearchTerm}
                                        onChange={(e) => setAuditSearchTerm(e.target.value)}
                                        className="h-10 pl-10 bg-zinc-800 border-zinc-700 focus:border-blue-400"
                                    />
                                </div>
                            </div>

                            {/* Audit Logs List */}
                            {isAuditLoading ? (
                                <div className="text-center py-8">
                                    <Loader2 className="h-6 w-6 text-blue-400 mx-auto animate-spin" />
                                </div>
                            ) : filteredAuditLogs.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="p-4 rounded-full bg-blue-500/10 w-fit mx-auto mb-4">
                                        <FileText className="h-8 w-8 text-blue-400" />
                                    </div>
                                    <p className="text-gray-400">No audit logs found</p>
                                    <p className="text-sm text-gray-500 mt-1">Activity changes will appear here</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <div className="space-y-2">
                                            {filteredAuditLogs.map((log) => {
                                                const timestamp = new Date(log.timestamp);

                                                // Determine display based on change type
                                                const getChangeTypeDisplay = () => {
                                                    switch (log.changeType) {
                                                        case 'balance_change':
                                                            return { icon: Wallet, label: 'Balance Change', color: 'blue', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', borderColor: 'border-blue-500/30' };
                                                        case 'wallet_created':
                                                            return { icon: Plus, label: 'Wallet Created', color: 'green', bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/30' };
                                                        case 'wallet_deleted':
                                                            return { icon: Trash2, label: 'Wallet Deleted', color: 'red', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/30' };
                                                        case 'goal_created':
                                                            return { icon: Plus, label: 'Goal Created', color: 'emerald', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' };
                                                        case 'goal_fulfilled':
                                                            return { icon: Trophy, label: 'Goal Fulfilled', color: 'amber', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' };
                                                        case 'goal_reactivated':
                                                            return { icon: RefreshCw, label: 'Goal Reactivated', color: 'yellow', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' };
                                                        case 'goal_deleted':
                                                            return { icon: Trash2, label: 'Goal Deleted', color: 'red', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/30' };
                                                        case 'recurring_created':
                                                            return { icon: Plus, label: 'Recurring Added', color: 'violet', bgColor: 'bg-violet-500/20', textColor: 'text-violet-400', borderColor: 'border-violet-500/30' };
                                                        case 'recurring_deleted':
                                                            return { icon: Trash2, label: 'Recurring Removed', color: 'rose', bgColor: 'bg-rose-500/20', textColor: 'text-rose-400', borderColor: 'border-rose-500/30' };
                                                        case 'transaction_deleted':
                                                            return { icon: Trash2, label: 'Transaction Deleted', color: 'orange', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400', borderColor: 'border-orange-500/30' };
                                                        default:
                                                            return { icon: History, label: log.changeType, color: 'gray', bgColor: 'bg-gray-500/20', textColor: 'text-gray-400', borderColor: 'border-gray-500/30' };
                                                    }
                                                };

                                                const typeDisplay = getChangeTypeDisplay();
                                                const TypeIcon = typeDisplay.icon;
                                                const hasAmountChange = log.changeType === 'balance_change' && log.changeAmount !== undefined;
                                                const isIncrease = (log.changeAmount || 0) > 0;

                                                // Parse details JSON for extra info
                                                let parsedDetails: any = null;
                                                try {
                                                    if (log.details) {
                                                        parsedDetails = JSON.parse(log.details);
                                                    }
                                                } catch (e) {
                                                    // Invalid JSON, ignore
                                                }

                                                // Check if this is a transaction deletion with amount
                                                const isTransactionDeletion = log.changeType === 'transaction_deleted';
                                                const isGoalEvent = ['goal_created', 'goal_deleted', 'goal_fulfilled'].includes(log.changeType);

                                                return (
                                                    <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                            <div className="flex-1 space-y-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-medium text-white">{log.entityName}</span>
                                                                    <span className={`px-2 py-0.5 rounded text-xs ${typeDisplay.bgColor} ${typeDisplay.textColor} border ${typeDisplay.borderColor} flex items-center gap-1`}>
                                                                        <TypeIcon className="h-3 w-3" />
                                                                        {typeDisplay.label}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500">
                                                                    {timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString()}
                                                                </p>
                                                                {/* Transaction details */}
                                                                {isTransactionDeletion && parsedDetails && (
                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                        {parsedDetails.category && (
                                                                            <span className="px-2 py-0.5 rounded text-xs bg-zinc-700/50 text-gray-300">
                                                                                {parsedDetails.category}
                                                                            </span>
                                                                        )}
                                                                        {parsedDetails.type && (
                                                                            <span className="px-2 py-0.5 rounded text-xs bg-zinc-700/50 text-gray-300 capitalize">
                                                                                {parsedDetails.type}
                                                                            </span>
                                                                        )}
                                                                        {parsedDetails.date && (
                                                                            <span className="px-2 py-0.5 rounded text-xs bg-zinc-700/50 text-gray-300">
                                                                                {new Date(parsedDetails.date).toLocaleDateString()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {/* Goal details */}
                                                                {isGoalEvent && parsedDetails && (
                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                        {parsedDetails.targetAmount && (
                                                                            <span className="px-2 py-0.5 rounded text-xs bg-zinc-700/50 text-gray-300">
                                                                                Target: ${parsedDetails.targetAmount.toLocaleString()}
                                                                            </span>
                                                                        )}
                                                                        {parsedDetails.category && (
                                                                            <span className="px-2 py-0.5 rounded text-xs bg-zinc-700/50 text-gray-300 capitalize">
                                                                                {parsedDetails.category}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {log.reason && (
                                                                    <p className="text-xs text-gray-400 italic">Note: {log.reason}</p>
                                                                )}
                                                            </div>
                                                            {/* Balance change amount */}
                                                            {hasAmountChange && (
                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-sm text-gray-400">
                                                                        ${log.previousBalance?.toLocaleString() || 0} → ${log.newBalance?.toLocaleString() || 0}
                                                                    </div>
                                                                    <div className={`px-3 py-1 rounded-lg ${isIncrease ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} font-semibold text-sm min-w-[80px] text-center`}>
                                                                        {isIncrease ? '+' : ''}${Math.abs(log.changeAmount || 0).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Transaction deletion amount */}
                                                            {isTransactionDeletion && log.changeAmount && (
                                                                <div className="flex items-center">
                                                                    <div className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 font-semibold text-sm min-w-[80px] text-center">
                                                                        -${Math.abs(log.changeAmount).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Pagination */}
                                    {totalAuditPages > 1 && (
                                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                            <p className="text-sm text-gray-500">
                                                Page {auditPage + 1} of {totalAuditPages}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setAuditPage(p => Math.max(0, p - 1))}
                                                    disabled={auditPage === 0}
                                                    className="border-zinc-700 hover:bg-white/10"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setAuditPage(p => p + 1)}
                                                    disabled={auditLogs.length < auditPageSize}
                                                    className="border-zinc-700 hover:bg-white/10"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Subscription Card - Revamped */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800 border border-white/10 shadow-2xl">
                    {/* Animated gradient border effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-amber-500/20 to-emerald-500/20 opacity-50 blur-xl" />
                    <div className="absolute inset-[1px] bg-zinc-900 rounded-3xl" />

                    {/* Floating orbs */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-amber-500/30 to-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />

                    <div className="relative z-10 p-8">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl blur-lg opacity-50" />
                                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-amber-500/30 to-yellow-500/20 border border-amber-500/30">
                                    <Crown className="h-8 w-8 text-amber-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-serif text-white">Subscription Plans</h3>
                                <p className="text-gray-400">Choose the plan that works for you</p>
                            </div>
                        </div>

                        {/* Plans Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Free Plan */}
                            <div className="relative group">
                                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10">
                                    {/* Current Plan Badge */}
                                    <div className="absolute -top-3 left-6">
                                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center gap-1.5">
                                            <CheckCircle className="h-3 w-3" />
                                            Current Plan
                                        </span>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex items-end justify-between mb-6">
                                            <div>
                                                <h4 className="text-xl font-bold text-white mb-1">Free</h4>
                                                <p className="text-sm text-gray-400">Perfect for getting started</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-4xl font-bold text-white">$0</span>
                                                <span className="text-gray-500">/month</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-3 mb-6">
                                            <li className="flex items-center gap-3 text-gray-300">
                                                <div className="p-1 rounded-full bg-emerald-500/20">
                                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                                </div>
                                                Up to 5 wallets
                                            </li>
                                            <li className="flex items-center gap-3 text-gray-300">
                                                <div className="p-1 rounded-full bg-emerald-500/20">
                                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                                </div>
                                                Basic transaction tracking
                                            </li>
                                            <li className="flex items-center gap-3 text-gray-300">
                                                <div className="p-1 rounded-full bg-emerald-500/20">
                                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                                </div>
                                                Monthly statistics
                                            </li>
                                            <li className="flex items-center gap-3 text-gray-300">
                                                <div className="p-1 rounded-full bg-emerald-500/20">
                                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                                </div>
                                                Goal tracking
                                            </li>
                                        </ul>

                                        <Button
                                            variant="outline"
                                            className="w-full h-12 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                                            disabled
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Active
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Pro Plan */}
                            <div className="relative group">
                                {/* Glow effect */}
                                <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity" />

                                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900 to-amber-500/5 border border-amber-500/30">
                                    {/* Recommended Badge */}
                                    <div className="absolute -top-3 left-6">
                                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-bold flex items-center gap-1.5">
                                            <Sparkles className="h-3 w-3" />
                                            Recommended
                                        </span>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex items-end justify-between mb-6">
                                            <div>
                                                <h4 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                                    Pro
                                                    <Crown className="h-5 w-5 text-amber-400" />
                                                </h4>
                                                <p className="text-sm text-amber-300/70">For power users</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">$9</span>
                                                <span className="text-gray-500">/month</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-3 mb-6">
                                            {proFeatures.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3 text-gray-200">
                                                    <div className="p-1 rounded-full bg-amber-500/20">
                                                        <Zap className="h-4 w-4 text-amber-400" />
                                                    </div>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            className="w-full h-12 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] transition-all"
                                            onClick={() => toast({ title: "Coming Soon", description: "Pro plan will be available soon!" })}
                                        >
                                            <Crown className="mr-2 h-5 w-5" />
                                            Upgrade to Pro
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Note */}
                        <p className="text-center text-sm text-gray-500 mt-6">
                            <Heart className="inline h-4 w-4 text-rose-400 mr-1" />
                            Cancel anytime. No hidden fees.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-white/5 space-y-4">
                    <div className="flex justify-center gap-4">
                        <a
                            href="https://www.linkedin.com/in/anganbasingha/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                        >
                            <Linkedin className="h-5 w-5" />
                        </a>
                        <a
                            href="https://anganba.netlify.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                        >
                            <Briefcase className="h-5 w-5" />
                        </a>
                        <a
                            href="https://github.com/anganba"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                        >
                            <Github className="h-5 w-5" />
                        </a>
                    </div>
                    <p
                        className="text-xs text-primary/80 font-medium"
                        style={{
                            textShadow: '0 0 5px rgba(163, 230, 53, 0.6), 0 0 10px rgba(163, 230, 53, 0.4)'
                        }}
                    >
                        &copy; {new Date().getFullYear()} Anganba Singha. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-violet-500/30">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif">Edit Profile</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Update your profile information
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-gray-300">Username</Label>
                            <Input
                                id="username"
                                value={profileForm.username}
                                onChange={e => setProfileForm({ ...profileForm, username: e.target.value })}
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-violet-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email</Label>
                            <Input
                                id="email"
                                value={profileForm.email}
                                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                type="email"
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-violet-400"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateProfile} disabled={isLoading} className="bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-violet-500/30">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif">Change Password</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Enter your current password and choose a new one
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="current" className="text-gray-300">Current Password</Label>
                            <Input
                                id="current"
                                type="password"
                                value={passwordForm.current}
                                onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-violet-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new" className="text-gray-300">New Password</Label>
                            <Input
                                id="new"
                                type="password"
                                value={passwordForm.new}
                                onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-violet-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm" className="text-gray-300">Confirm New Password</Label>
                            <Input
                                id="confirm"
                                type="password"
                                value={passwordForm.confirm}
                                onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-violet-400"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
                        <Button onClick={handleChangePassword} disabled={isLoading} className="bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:opacity-90">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Update Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Data Dialog */}
            <ExportDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} />
        </div >
    );
}
