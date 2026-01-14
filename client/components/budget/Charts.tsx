import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { BudgetMonth } from '@shared/api';

interface ChartsProps {
  budget: BudgetMonth;
  currency: string;
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

export function BudgetCharts({ budget, currency }: ChartsProps) {
  const symbol = getCurrencySymbol(currency);

  // Pie chart data for "Allocation" - Aggregated by Category
  const categoryMap = new Map<string, number>();

  budget.transactions.forEach((t) => {
    // Exclude Income from Expense Chart
    // Based on Dashboard logic:
    // Income: Paycheck, Bonus, Debt Added
    // Expenses/Allocation: Everything else + Savings
    const isIncome = ['Paycheck', 'Bonus', 'Debt Added', 'income'].includes(t.category);

    if (!isIncome && t.actual > 0) {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + t.actual);
    }
  });

  const pieData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Sort by value descending

  // Generate colors dynamically based on number of items
  const generateColors = (count: number) => {
    // Pink/Mauve/Purple palette
    const baseColors = [
      '#ec4899', // Pink 500
      '#d946ef', // Fuchsia 500
      '#8b5cf6', // Violet 500
      '#fb7185', // Rose 400
      '#c084fc', // Purple 400
      '#f472b6', // Pink 400
      '#a855f7', // Purple 500
      '#e879f9', // Fuchsia 400
    ];
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  };

  const pieColors = generateColors(pieData.length);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover p-2 border border-border rounded shadow">
          <p className="text-sm font-sans text-popover-foreground">
            {`${payload[0].name}: ${symbol}${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      {/* Budget Allocation Pie Chart */}
      <div className="bg-card border border-border rounded-xl p-6 overflow-hidden h-full shadow-sm">
        <h3 className="font-serif font-bold text-lg mb-6 text-center text-card-foreground">Expense Allocation</h3>
        <ResponsiveContainer width="100%" height={350} minWidth={1}>
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={110}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
