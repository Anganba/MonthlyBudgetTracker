import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Wallet, PiggyBank, BarChart3, User, ArrowRightLeft, ChevronRight, ChevronLeft, Repeat } from "lucide-react";

import { useBudget } from "@/hooks/use-budget";
import { useWallets } from "@/hooks/use-wallets";

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    mobile?: boolean;
}

export function Sidebar({ collapsed, setCollapsed, mobile = false }: SidebarProps) {
    const { stats } = useBudget();
    const { wallets } = useWallets();
    const location = useLocation();
    const currentPath = location.pathname;

    const links = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/wallets", label: "Wallets", icon: Wallet },
        { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
        { href: "/goals", label: "Goals", icon: PiggyBank },
        { href: "/recurring", label: "Recurring", icon: Repeat },
        { href: "/statistics", label: "Statistics", icon: BarChart3 },
        { href: "/profile", label: "Profile", icon: User },
    ];

    // Calculate Net Worth if wallets exist
    const hasWallets = wallets.length > 0;
    const netWorth = wallets.reduce((sum, w) => sum + w.balance, 0);

    // Display Logic: Show Net Worth if active, otherwise Monthly Budget Balance
    const displayLabel = hasWallets ? "Net Worth" : "Total Balance";
    const displayAmount = hasWallets ? netWorth : stats.balance;

    // Budget Progress Calculation (expenses vs income = spending ratio)
    const budgetSpent = stats.expenses || 0;
    const budgetLimit = stats.income || 1; // Use income as the budget reference
    const budgetProgress = Math.min(budgetSpent / budgetLimit, 1); // Cap at 100%
    const circumference = 2 * Math.PI * 45; // ~283
    const progressDash = budgetProgress * circumference;

    // Dynamic color based on budget usage
    const getProgressColor = () => {
        if (budgetProgress >= 0.9) return { start: '#ef4444', mid: '#f97316', end: '#eab308' }; // Red/Orange - Over 90%
        if (budgetProgress >= 0.7) return { start: '#eab308', mid: '#f97316', end: '#10b981' }; // Yellow/Orange - 70-90%
        return { start: '#10b981', mid: '#06b6d4', end: '#8b5cf6' }; // Green/Cyan/Violet - Under 70%
    };
    const progressColors = getProgressColor();

    return (
        <div
            className={cn(
                "h-screen bg-black text-white flex flex-col p-4 overflow-y-auto z-50 border-r border-white/10 transition-all duration-300 ease-in-out [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
                mobile ? "w-full border-none" : "fixed left-0 top-0",
                !mobile && (collapsed ? "w-20" : "w-64")
            )}
        >
            <div className="flex items-center justify-center mb-8">
                <div
                    className={cn(
                        "flex items-center gap-3 overflow-hidden whitespace-nowrap cursor-pointer group transition-all",
                        collapsed ? "justify-center" : "w-full"
                    )}
                    onClick={() => !mobile && setCollapsed(!collapsed)}
                    title="Toggle Sidebar"
                >
                    {/* Enhanced Icon with Gradient Background */}
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Wallet className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                    </div>
                    {!collapsed && (
                        <h1 className="text-xl font-bold font-serif bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
                            Amar Taka Koi
                        </h1>
                    )}
                </div>
            </div>

            <div className="mb-6">
                {/* Total Balance Circle - Only show when NOT collapsed */}
                {!collapsed ? (
                    <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center group">
                        {/* Glow effects - outside the clipped area */}
                        <div className="absolute inset-[-10px] rounded-full bg-gradient-to-br from-emerald-500/25 via-cyan-500/15 to-primary/25 blur-xl animate-pulse pointer-events-none" style={{ animationDuration: '2s' }} />

                        {/* Outer glowing ring with shadow */}
                        <div className="absolute inset-0 rounded-full border-2 border-primary/50 shadow-[0_0_20px_rgba(163,230,53,0.4),0_0_40px_rgba(163,230,53,0.2)]" />

                        {/* Inner clipped container */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            {/* Inner dark background */}
                            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-primary/20" />

                            {/* Progress Ring SVG */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="netWorthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={progressColors.start} />
                                        <stop offset="50%" stopColor={progressColors.mid} />
                                        <stop offset="100%" stopColor={progressColors.end} />
                                    </linearGradient>
                                </defs>
                                {/* Background Ring */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="rgba(163,230,53,0.15)"
                                    strokeWidth="5"
                                />
                                {/* Progress Ring with strong glow */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="url(#netWorthGradient)"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeDasharray={`${progressDash} ${circumference}`}
                                    className="transition-all duration-1000"
                                    style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.6)) drop-shadow(0 0 15px rgba(16,185,129,0.3))' }}
                                />
                            </svg>
                        </div>

                        {/* Center Content - positioned above clipped container */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-[11px] text-emerald-400 uppercase tracking-[0.15em] font-bold mb-1.5 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{displayLabel}</p>
                                <p
                                    className="text-3xl font-black tracking-tight"
                                    style={{
                                        background: 'linear-gradient(135deg, #a3e635 0%, #22d3ee 50%, #a3e635 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        filter: 'drop-shadow(0 0 10px rgba(163,230,53,0.4))'
                                    }}
                                >
                                    ${displayAmount.toLocaleString()}
                                </p>
                                {budgetLimit > 0 && (
                                    <p className="text-[10px] text-cyan-400/70 mt-1.5 font-medium">
                                        {Math.round(budgetProgress * 100)}% of budget used
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Collapsed Balance View (Mini) - Enhanced
                    <div className="text-center mb-6 py-4 border-y border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent">
                        <p className="text-[10px] text-emerald-400/70 uppercase mb-1">{hasWallets ? "NET" : "TOT"}</p>
                        <p className="text-xs font-bold text-emerald-400">${(displayAmount / 1000).toFixed(1)}k</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 space-y-1">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = currentPath === link.href;
                    return (
                        <Link
                            key={link.href}
                            to={link.href}
                            className="block"
                            title={collapsed ? link.label : ""}
                            onClick={(e) => {
                                if (isActive) {
                                    e.preventDefault();
                                    window.location.reload();
                                }
                            }}
                        >
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary text-black shadow-lg shadow-primary/30"
                                        : "text-gray-400 hover:text-primary hover:bg-primary/10",
                                    collapsed ? "justify-center px-2" : ""
                                )}
                            >
                                {/* Breathing glow effect for inactive items */}
                                {!isActive && (
                                    <div
                                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 animate-pulse opacity-0 group-hover:opacity-0"
                                        style={{
                                            animation: 'breathe 3s ease-in-out infinite',
                                            animationDelay: `${links.indexOf(link) * 0.3}s`
                                        }}
                                    />
                                )}
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors relative z-10",
                                    isActive
                                        ? "bg-black/20"
                                        : "bg-white/5 group-hover:bg-primary/20",
                                    !isActive && "animate-[breathe_3s_ease-in-out_infinite]"
                                )}
                                    style={!isActive ? { animationDelay: `${links.indexOf(link) * 0.4}s` } : undefined}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                </div>
                                {!collapsed && <span className="relative z-10">{link.label}</span>}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {!collapsed && (
                <div className="mt-auto pt-4 text-center border-t border-white/5">
                    <p
                        className="text-xs font-medium text-primary animate-pulse"
                        style={{
                            animationDuration: '3s',
                            textShadow: '0 0 5px rgba(163, 230, 53, 0.8), 0 0 10px rgba(163, 230, 53, 0.5), 0 0 20px rgba(163, 230, 53, 0.3)'
                        }}
                    >
                        &copy; {new Date().getFullYear()} Anganba Singha
                    </p>
                </div>
            )}
        </div>
    );
}
