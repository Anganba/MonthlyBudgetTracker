import React from 'react';
import { HardHat } from 'lucide-react';

interface PlaceholderPageProps {
    title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex flex-col items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-md">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
                    <HardHat className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h1 className="text-2xl font-bold font-serif text-gray-900 dark:text-white mb-2">
                    {title}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    This feature is currently under development. Check back soon for updates!
                </p>
            </div>
        </div>
    );
}
