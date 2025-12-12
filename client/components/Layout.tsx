import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar collapsed={isCollapsed} setCollapsed={setIsCollapsed} />
            </div>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out md:ml-64" style={{ marginLeft: isCollapsed ? '5rem' : '' }}>
                {/* Mobile Header */}
                <div className="md:hidden flex items-center p-4 border-b border-border bg-background">
                    <MobileNav />
                    <span className="ml-4 font-bold font-serif text-lg">Amar TK Koi</span>
                </div>

                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
