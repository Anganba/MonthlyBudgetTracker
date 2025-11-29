import React from 'react';

export const Footer = () => {
    return (
        <footer className="w-full py-6 text-center text-sm text-gray-500 dark:text-gray-400 mt-auto">
            <p>&copy; {new Date().getFullYear()} Anganba Singha. All rights reserved.</p>
        </footer>
    );
};
