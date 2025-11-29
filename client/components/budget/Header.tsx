import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Printer, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface HeaderProps {
  month: string;
  year: number;
  onMonthChange: (month: string, year: number) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function BudgetHeader({ month, year, onMonthChange, currency, onCurrencyChange }: HeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { logout } = useAuth();

  const currentMonthIndex = MONTHS.findIndex(m => m === month);

  const handlePreviousMonth = () => {
    if (currentMonthIndex === 0) {
      onMonthChange(MONTHS[11], year - 1);
    } else {
      onMonthChange(MONTHS[currentMonthIndex - 1], year);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      onMonthChange(MONTHS[0], year + 1);
    } else {
      onMonthChange(MONTHS[currentMonthIndex + 1], year);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gradient-to-r from-budget-header/20 to-budget-header/10 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition no-print"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-serif font-bold text-budget-header">
                {month}
              </h1>
              <span className="text-lg font-sans text-gray-600 dark:text-gray-400">
                {year}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition no-print"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-sans text-gray-600 dark:text-gray-400">
                Currency:
              </label>
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm font-sans"
              >
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="BDT">৳ BDT</option>
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition no-print"
              aria-label="Print"
            >
              <Printer className="w-5 h-5" />
            </button>

            <button
              onClick={logout}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition no-print"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 font-sans">
          {month} 1 - {month} 30, {year}
        </div>
      </div>
    </div>
  );
}
