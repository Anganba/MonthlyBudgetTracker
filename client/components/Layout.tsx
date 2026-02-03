import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useWallets } from '@/hooks/use-wallets';
import { Wallet } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        return saved ? JSON.parse(saved) : false;
    });

    React.useEffect(() => {
        localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);
    const { wallets } = useWallets();

    const netWorth = wallets.reduce((sum, w) => sum + w.balance, 0);

    // Sidebar widths: expanded = 16rem (256px), collapsed = 5rem (80px)
    const sidebarWidth = isCollapsed ? '6rem' : '18rem';

    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar collapsed={isCollapsed} setCollapsed={setIsCollapsed} />
            </div>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-40 flex items-center justify-between p-3 bg-[hsl(var(--sidebar-background))]/95 backdrop-blur-sm border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <MobileNav />
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="Amar Taka Koi" className="w-8 h-8 object-contain" />
                            <span className="font-bold font-serif text-white">Amar Taka Koi</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">
                            <span className="text-xs font-bold text-primary">${netWorth.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content - margin only on desktop (md+) */}
                <main
                    className="flex-1 transition-all duration-300 ease-in-out"
                    style={{
                        marginLeft: 0
                    }}
                >
                    {/* Desktop margin wrapper */}
                    <div
                        className="hidden md:block h-full"
                        style={{ marginLeft: sidebarWidth }}
                    >
                        <div className="min-h-full">
                            {children}
                        </div>
                    </div>
                    {/* Mobile - no margin */}
                    <div className="md:hidden">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

