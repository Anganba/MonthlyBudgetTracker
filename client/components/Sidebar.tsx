import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Wallet, PiggyBank, BarChart3, User, ArrowRightLeft, ChevronRight, ChevronLeft, Repeat } from "lucide-react";

import { useBudget } from "@/hooks/use-budget";

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    mobile?: boolean;
}

export function Sidebar({ collapsed, setCollapsed, mobile = false }: SidebarProps) {
    const { stats } = useBudget();
    const location = useLocation();
    const currentPath = location.pathname;

    const links = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
        { href: "/goals", label: "Goals", icon: PiggyBank },
        { href: "/recurring", label: "Recurring", icon: Repeat },
        { href: "/statistics", label: "Statistics", icon: BarChart3 },
        { href: "/profile", label: "Profile", icon: User },
    ];

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
                        "flex items-center gap-2 overflow-hidden whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                        collapsed ? "justify-center" : "w-full"
                    )}
                    onClick={() => !mobile && setCollapsed(!collapsed)}
                    title="Toggle Sidebar"
                >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5 text-black" />
                    </div>
                    {!collapsed && (
                        <h1 className="text-lg font-bold font-serif">Amar Taka Koi</h1>
                    )}
                </div>
            </div>

            <div className="mb-6">
                {/* Total Balance Circle - Only show when NOT collapsed */}
                {!collapsed ? (
                    <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
                        {/* Outer Ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30"></div>

                        {/* Progress Ring Segment (Visual only for now) */}
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary rotate-45"></div>

                        <div className="text-center z-10">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Balance</p>
                            <p className="text-2xl font-bold text-white">${stats.balance.toLocaleString()}</p>
                        </div>
                    </div>
                ) : (
                    // Collapsed Balance View (Mini)
                    <div className="text-center mb-6 py-4 border-y border-white/10">
                        <p className="text-[10px] text-gray-400 uppercase mb-1">Bal</p>
                        <p className="text-xs font-bold text-primary">${(stats.balance / 1000).toFixed(1)}k</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = currentPath === link.href;
                    return (
                        <Link key={link.href} to={link.href} className="block" title={collapsed ? link.label : ""}>
                            <div
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-primary/20 text-primary border-l-4 border-primary"
                                        : "text-gray-400 hover:text-white hover:bg-white/5",
                                    collapsed ? "justify-center px-2" : ""
                                )}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                {!collapsed && <span>{link.label}</span>}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {!collapsed && (
                <div className="mt-auto pt-4 text-xs text-gray-400 text-center border-t border-white/5">
                    &copy; {new Date().getFullYear()} Anganba Singha
                </div>
            )}
        </div>
    );
}
