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
    // Distinct palette for better contrast
    const baseColors = [
      '#2DD4BF', // Teal
      '#FACC15', // Yellow
      '#F472B6', // Pink
      '#A78BFA', // Purple
      '#4ADE80', // Green
      '#38BDF8', // Sky Blue
      '#FB923C', // Orange
      '#818CF8', // Indigo
      '#F87171', // Red
      '#A3E635', // Lime
      '#E879F9', // Fuchsia
      '#60A5FA', // Blue
      '#C084FC', // Violet
      '#FB7185', // Rose
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
