import React from 'react';

export function LoadingScreen({ size = 'lg', type = 'full' }: { size?: 'sm' | 'md' | 'lg', type?: 'full' | 'inline' }) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-24 h-24'
    };

    const logoSizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-12 h-12'
    };

    const containerClasses = type === 'full'
        ? "fixed inset-0 z-[100] flex items-center justify-center bg-background"
        : "flex items-center justify-center p-8";

    return (
        <div className={containerClasses}>
            <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
                {/* Spinner Ring */}
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-primary border-r-transparent border-b-primary/30 border-l-transparent"></div>
                {/* Pulsing Logo */}
                <img
                    src="/logo.png"
                    alt="Loading..."
                    className={`${logoSizes[size]} object-contain animate-pulse`}
                />
            </div>
        </div>
    );
}
