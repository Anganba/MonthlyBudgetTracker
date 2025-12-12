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

  const lastDay = new Date(year, currentMonthIndex + 1, 0).getDate();

  return (
    <div className="bg-gradient-to-r from-budget-header/20 to-budget-header/10 border-b border-border px-6 py-6">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-white/10 rounded-lg transition no-print text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-baseline justify-center gap-2 min-w-[200px]">
              <h1 className="text-2xl font-serif font-bold text-budget-header">
                {month}
              </h1>
              <span className="text-lg font-sans text-muted-foreground">
                {year}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/10 rounded-lg transition no-print text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-sans text-muted-foreground">
                Currency:
              </label>
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="px-3 py-2 border border-border bg-card text-foreground rounded-lg text-sm font-sans focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="BDT">৳ BDT</option>
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="p-2 hover:bg-white/10 rounded-lg transition no-print text-foreground"
              aria-label="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground font-sans">
          {month} 1 - {month} {lastDay}, {year}
        </div>
      </div>
    </div>
  );
}
