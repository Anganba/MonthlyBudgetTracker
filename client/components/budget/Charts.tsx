import React from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { BudgetMonth, Transaction } from '@shared/api';

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

  // Calculate totals by category
  const categoryTotals = {
    income: 0,
    expenses: 0,
    bills: 0,
    savings: 0,
    debt: 0,
  };

  budget.transactions.forEach((transaction) => {
    categoryTotals[transaction.category] += transaction.actual;
  });

  const totalIncome = categoryTotals.income + budget.rolloverActual;
  const totalOutflows = categoryTotals.expenses + categoryTotals.bills + categoryTotals.savings + categoryTotals.debt;
  const leftToSpend = totalIncome - totalOutflows;

  // Donut chart data for "Left to Spend"
  const donutData = [
    { name: 'Spent', value: Math.max(0, totalOutflows) },
    { name: 'Left', value: Math.max(0, leftToSpend) },
  ];

  const donutColors = [
    leftToSpend < 0 ? '#dc2626' : '#f97316',
    leftToSpend < 0 ? '#991b1b' : '#7c2d12',
  ];

  // Bar chart data for "Cash Flow"
  const barData = [
    { name: 'Income', value: totalIncome },
    { name: 'Expenses', value: categoryTotals.expenses },
    { name: 'Bills', value: categoryTotals.bills },
    { name: 'Savings', value: categoryTotals.savings },
    { name: 'Debt', value: categoryTotals.debt },
  ];

  // Pie chart data for "Allocation"
  const pieData = [
    { name: 'Expenses', value: categoryTotals.expenses },
    { name: 'Bills', value: categoryTotals.bills },
    { name: 'Savings', value: categoryTotals.savings },
    { name: 'Debt', value: categoryTotals.debt },
  ].filter(item => item.value > 0);

  const pieColors = ['#ec4899', '#6366f1', '#10b981', '#ef4444'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-300 dark:border-gray-600 rounded shadow">
          <p className="text-sm font-sans text-gray-800 dark:text-gray-200">
            {`${payload[0].name}: ${symbol}${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Left to Spend Donut Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="font-serif font-bold text-lg mb-6 text-center">
          Amount Left to Spend
        </h3>
        <div className="flex justify-center items-center">
          <div className="relative">
            <ResponsiveContainer width={250} height={250}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={donutColors[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className={`font-serif font-bold text-2xl ${leftToSpend < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {symbol}{Math.abs(leftToSpend).toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {leftToSpend < 0 ? 'Over Budget' : 'Available'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Bar Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="font-serif font-bold text-lg mb-6">Cash Flow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={barData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: symbol, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Budget Allocation Pie Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 overflow-hidden">
        <h3 className="font-serif font-bold text-lg mb-6">Budget Allocation</h3>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
