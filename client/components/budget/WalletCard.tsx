import { Wallet } from "@shared/api";
import { Smartphone, Landmark, CreditCard, Banknote, Wallet as WalletIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletCardProps {
    wallet: Wallet;
}

export function WalletCard({ wallet }: WalletCardProps) {
    const getWalletIcon = (type: string) => {
        switch (type) {
            case 'mfs': return Smartphone;
            case 'bank': return Landmark;
            case 'credit_card': return CreditCard;
            case 'cash': return Banknote;
            default: return WalletIcon;
        }
    };

    // Aesthetic gradient colors matching the dashboard theme
    const getWalletStyles = (type: string) => {
        switch (type) {
            case 'mfs':
                return {
                    bg: 'bg-gradient-to-r from-pink-500/20 to-rose-500/10',
                    border: 'border-pink-500/30 hover:border-pink-400/50',
                    iconBg: 'bg-pink-500/20',
                    iconColor: 'text-pink-400',
                    glow: 'hover:shadow-pink-500/10'
                };
            case 'bank':
                return {
                    bg: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/10',
                    border: 'border-blue-500/30 hover:border-blue-400/50',
                    iconBg: 'bg-blue-500/20',
                    iconColor: 'text-blue-400',
                    glow: 'hover:shadow-blue-500/10'
                };
            case 'credit_card':
                return {
                    bg: 'bg-gradient-to-r from-violet-500/20 to-purple-500/10',
                    border: 'border-violet-500/30 hover:border-violet-400/50',
                    iconBg: 'bg-violet-500/20',
                    iconColor: 'text-violet-400',
                    glow: 'hover:shadow-violet-500/10'
                };
            case 'cash':
                return {
                    bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/10',
                    border: 'border-emerald-500/30 hover:border-emerald-400/50',
                    iconBg: 'bg-emerald-500/20',
                    iconColor: 'text-emerald-400',
                    glow: 'hover:shadow-emerald-500/10'
                };
            default:
                return {
                    bg: 'bg-gradient-to-r from-slate-500/20 to-gray-500/10',
                    border: 'border-slate-500/30 hover:border-slate-400/50',
                    iconBg: 'bg-slate-500/20',
                    iconColor: 'text-slate-400',
                    glow: 'hover:shadow-slate-500/10'
                };
        }
    };

    const Icon = getWalletIcon(wallet.type);
    const styles = getWalletStyles(wallet.type);


    return (
        <a
            href="/wallets"
            className={cn(
                "group flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-sm",
                "transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer",
                styles.bg,
                styles.border,
                styles.glow
            )}
        >
            {/* Icon */}
            <div className={cn("p-1.5 rounded-lg", styles.iconBg)}>
                <Icon className={cn("w-4 h-4", styles.iconColor)} />
            </div>

            {/* Name & Balance */}
            <div className="flex flex-col min-w-0">
                <span className="text-xs text-white/60 truncate max-w-[80px]">{wallet.name}</span>
                <span className="text-sm font-bold text-white">${wallet.balance.toLocaleString()}</span>
            </div>


        </a>
    );
}
