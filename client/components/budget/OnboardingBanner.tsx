import { Button } from "@/components/ui/button";
import { Wallet, Plus, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingBannerProps {
    onAddWallet: () => void;
}

export function OnboardingBanner({ onAddWallet }: OnboardingBannerProps) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl p-6 md:p-8",
            "bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-cyan-500/10",
            "border border-violet-500/30 shadow-xl shadow-violet-500/10"
        )}>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-violet-500/20 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                {/* Icon */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 border border-violet-500/40 shadow-lg shadow-violet-500/20">
                    <Wallet className="h-8 w-8 text-violet-300" />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-yellow-400" />
                        <span className="text-xs font-medium text-violet-300 uppercase tracking-wider">Get Started</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                        Welcome! Let's set up your first wallet
                    </h3>
                    <p className="text-gray-400 text-sm md:text-base max-w-xl">
                        Create a wallet to start tracking your income and expenses. You can add multiple wallets like cash, bank accounts, or mobile wallets.
                    </p>
                </div>

                {/* CTA Button */}
                <Button
                    onClick={onAddWallet}
                    className={cn(
                        "h-12 px-6 font-bold rounded-xl gap-2",
                        "bg-gradient-to-r from-violet-500 to-purple-500",
                        "shadow-lg shadow-violet-500/30",
                        "text-white hover:opacity-90 active:scale-[0.98]",
                        "transition-all whitespace-nowrap"
                    )}
                >
                    <Plus className="h-5 w-5" />
                    Add Wallet
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
