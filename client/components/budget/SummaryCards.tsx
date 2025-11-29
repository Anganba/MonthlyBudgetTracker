import React from 'react';

interface SummaryCardsProps {
  income: number;
  expenses: number;
  bills: number;
  savings: number;
  debt: number;
  currency: string;
}

interface Card {
  title: string;
  value: number;
  bgColor: string;
  textColor: string;
  icon: string;
}

const getCurrencySymbol = (currency: string) => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    BDT: '৳',
  };
  return symbols[currency] || '$';
};

const formatCurrency = (value: number, currency: string) => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${Math.abs(value).toFixed(2)}`;
};

export function SummaryCards({
  income,
  expenses,
  bills,
  savings,
  debt,
  currency,
}: SummaryCardsProps) {
  const cards: Card[] = [
    {
      title: 'Income',
      value: income,
      bgColor: 'from-budget-header/30 to-budget-header/10',
      textColor: 'text-budget-header',
      icon: '💰',
    },
    {
      title: 'Expenses',
      value: expenses,
      bgColor: 'from-budget-expense/30 to-budget-expense/10',
      textColor: 'text-budget-expense',
      icon: '🛍️',
    },
    {
      title: 'Bills',
      value: bills,
      bgColor: 'from-budget-bill/30 to-budget-bill/10',
      textColor: 'text-budget-bill',
      icon: '📋',
    },
    {
      title: 'Savings',
      value: savings,
      bgColor: 'from-budget-savings/30 to-budget-savings/10',
      textColor: 'text-budget-savings',
      icon: '🏦',
    },
    {
      title: 'Debt',
      value: debt,
      bgColor: 'from-budget-debt/30 to-budget-debt/10',
      textColor: 'text-budget-debt',
      icon: '💳',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 px-6 py-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`bg-gradient-to-br ${card.bgColor} border border-gray-200 dark:border-gray-700 rounded-xl p-5 transition-all hover:shadow-lg`}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-sans font-semibold text-gray-700 dark:text-gray-300">
              {card.title}
            </h3>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <p className={`${card.textColor} font-sans font-bold text-lg whitespace-nowrap`}>
            {formatCurrency(card.value, currency)}
          </p>
        </div>
      ))}
    </div>
  );
}
