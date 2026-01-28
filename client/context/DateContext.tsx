import React, { createContext, useContext, useState, ReactNode } from "react";

interface DateContextType {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    month: string;
    year: number;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: ReactNode }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const month = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() - 1);
            return d;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + 1);
            return d;
        });
    };

    return (
        <DateContext.Provider value={{
            currentDate,
            setCurrentDate,
            month,
            year,
            handlePrevMonth,
            handleNextMonth
        }}>
            {children}
        </DateContext.Provider>
    );
}

export function useDate() {
    const context = useContext(DateContext);
    if (context === undefined) {
        throw new Error("useDate must be used within a DateProvider");
    }
    return context;
}
