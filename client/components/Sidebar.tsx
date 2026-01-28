import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Wallet, PiggyBank, BarChart3, User, ArrowRightLeft, ChevronRight, ChevronLeft, Repeat, History } from "lucide-react";

import { useBudget } from "@/hooks/use-budget";
import { useWallets } from "@/hooks/use-wallets";
import { useDate } from "@/context/DateContext";

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    mobile?: boolean;
}

export function Sidebar({ collapsed, setCollapsed, mobile = false }: SidebarProps) {
    const { month, year } = useDate();
    const { stats } = useBudget(month, year);
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
        { href: "/audit-trail", label: "Audit Trail", icon: History },
        { href: "/profile", label: "Profile", icon: User },
    ];

    // Calculate Net Worth if wallets exist
    const hasWallets = wallets.length > 0;
    const netWorth = wallets.reduce((sum, w) => sum + w.balance, 0);

    // Display Net Worth from wallets (shows $0 when no wallets)
    const displayLabel = "Net Worth";
    const displayAmount = netWorth;

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
                "h-screen bg-[hsl(var(--sidebar-background))] text-white flex flex-col p-4 overflow-y-auto z-50 border-r border-white/10 transition-all duration-300 ease-in-out [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
                mobile ? "w-full border-none" : "fixed left-0 top-0",
                !mobile && (collapsed ? "w-24" : "w-72")
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
                    {/* Logo Image */}
                    <img
                        src="/logo.png"
                        alt="Amar Taka Koi"
                        className="w-16 h-16 object-contain shrink-0 rounded-lg"
                    />
                    {!collapsed && (
                        <h1
                            className="text-xl font-semibold uppercase tracking-wide"
                            style={{
                                fontFamily: "'Rajdhani', sans-serif",
                                color: '#ffffff',
                                letterSpacing: '0.05em'
                            }}
                        >
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
                        <div className="absolute inset-[-10px] rounded-full bg-gradient-to-br from-purple-500/25 via-violet-500/15 to-primary/25 blur-xl animate-pulse pointer-events-none" style={{ animationDuration: '2s' }} />

                        {/* Outer glowing ring with shadow */}
                        <div className="absolute inset-0 rounded-full border-2 border-primary/50 shadow-[0_0_20px_rgba(250,208,0,0.4),0_0_40px_rgba(250,208,0,0.2)]" />

                        {/* Inner clipped container */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            {/* Inner dark background */}
                            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-violet-950 via-purple-950 to-[hsl(var(--sidebar-background))] border border-primary/20" />

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
                            <div className="text-center w-full px-4" title={`Exact: $${displayAmount.toLocaleString()}`}>
                                <p className="text-[11px] text-cyan-400 uppercase tracking-[0.15em] font-bold mb-1.5 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{displayLabel}</p>
                                <p
                                    className={cn(
                                        "font-black tracking-tight transition-all duration-300",
                                        displayAmount >= 1_000_000 || displayAmount <= -1_000_000 ? "text-3xl" : // Compact notation usually short
                                            displayAmount >= 100_000 || displayAmount <= -100_000 ? "text-2xl" : // 6 digits + decimals
                                                "text-3xl" // Standard
                                    )}
                                    style={{
                                        background: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 50%, #14B8A6 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.4))'
                                    }}
                                >
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        notation: Math.abs(displayAmount) >= 1_000_000 ? "compact" : "standard",
                                        maximumFractionDigits: 2
                                    }).format(displayAmount)}
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
                        <p className="text-xs text-emerald-400/70 uppercase mb-1 font-semibold">{hasWallets ? "NET" : "TOT"}</p>
                        <p className="text-sm font-bold text-emerald-400" title={`$${displayAmount.toLocaleString()}`}>
                            {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                notation: "compact",
                                maximumFractionDigits: 1
                            }).format(displayAmount)}
                        </p>
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
                                {/* Persistent Breathing Glow (Row) - Always rendered for sync, hidden via opacity */}
                                <div
                                    className={cn(
                                        "absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 animate-pulse transition-opacity duration-500 pointer-events-none",
                                        isActive ? "opacity-0" : "opacity-0 group-hover:opacity-0"
                                        // Note: The original code had this entire div conditional on !isActive.
                                        // It was also 'opacity-0' initially? 
                                        // If it was opacity-0 and animate-pulse, it pulses opacity?
                                        // But the style={{ animation: 'breathe...' }} overrides it.
                                        // Let's assume we want it visible (opacity-100) when inactive.
                                        // Wait, checking original code: className="... opacity-0 ..." style="animation: breathe..."
                                        // The 'breathe' animation handles the visibility/glow.
                                        // So we just need to NOT unmount it.
                                        // We toggle 'hidden' or 'opacity-0' if we want to suppress it fully?
                                        // Actually 'breathe' animates backgroundColor/shadow/filter.
                                        // If we allow it to run while active, it might clash visually.
                                        // So we set opacity-0 when isActive to hide it visualy but keep it running.
                                    )}
                                    style={{
                                        animation: 'breathe 4s ease-in-out infinite',
                                        animationDelay: `${links.indexOf(link) * 0.35}s`
                                    }}
                                />

                                {/* Icon Container */}
                                <div className="relative p-1.5 rounded-lg z-10 shrink-0">
                                    {/* Static Background Layer */}
                                    <div className={cn(
                                        "absolute inset-0 rounded-lg transition-colors duration-300",
                                        isActive
                                            ? "bg-black/20"
                                            : "bg-white/5 group-hover:bg-primary/20"
                                    )} />

                                    {/* Persistent Synchronized Icon Glow Layer */}
                                    <div
                                        className={cn(
                                            "absolute inset-0 rounded-lg transition-opacity duration-500",
                                            isActive ? "opacity-0" : "opacity-100 group-hover:opacity-0"
                                        )}
                                        style={{
                                            animation: 'breathe 4s ease-in-out infinite',
                                            animationDelay: `${links.indexOf(link) * 0.35}s`
                                        }}
                                    />

                                    <Icon className="w-4 h-4 shrink-0 relative z-20" />
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
