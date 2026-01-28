"use client";

import { Wallet, Plus, Sparkles } from "lucide-react";
import { useWallets } from "@/hooks/use-wallets";
import { WalletCard } from "./WalletCard";
import { OnboardingBanner } from "./OnboardingBanner";
import { cn } from "@/lib/utils";

export function AccountsSection() {
    const { wallets } = useWallets();

    // Sort wallets by order
    const sortedWallets = [...wallets].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        // Fallback for older items: sort by createdAt desc if order is missing
        if (!a.order && !b.order) return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        // If mixed, items with order come first? Or last? Let's put ordered items first.
        return (a.order || 9999) - (b.order || 9999);
    });

    if (sortedWallets.length === 0) {
        return (
            <div className="relative z-10 mb-6 md:mb-8">
                <OnboardingBanner onAddWallet={() => window.location.href = '/wallets'} />
            </div>
        );
    }

    const netWorth = sortedWallets.reduce((acc, w) => acc + w.balance, 0);

    return (
        <div className="relative z-10 mb-3">
            {/* Single Row Container */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-white/5">

                {/* Left: Title */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="p-1.5 rounded-lg bg-violet-500/15 border border-violet-500/20">
                        <Wallet className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-sm font-semibold text-white hidden sm:block">My Accounts</span>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-white/10 flex-shrink-0 hidden sm:block" />

                {/* Center: Scrollable Account Chips */}
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-2">
                        {sortedWallets.map((wallet) => (
                            <WalletCard key={wallet.id} wallet={wallet} />
                        ))}

                        {/* Add Account Button */}
                        <a
                            href="/wallets"
                            className={cn(
                                "flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed",
                                "border-white/20 hover:border-violet-500/50 hover:bg-violet-500/10",
                                "transition-all duration-200 cursor-pointer flex-shrink-0"
                            )}
                        >
                            <Plus className="w-4 h-4 text-white/40" />
                            <span className="text-xs text-white/40 hidden md:block">Add</span>
                        </a>
                    </div>
                </div>

                {/* Right: Net Worth Badge */}
                <div className="flex-shrink-0">
                    <a
                        href="/wallets"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-emerald-500/10 border border-primary/30 hover:border-primary/50 transition-colors cursor-pointer"
                    >
                        <Sparkles className="w-3 h-3 text-primary" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white/60 hidden lg:inline">Net Worth:</span>
                            <span className="text-sm font-bold text-primary">${netWorth.toLocaleString()}</span>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
