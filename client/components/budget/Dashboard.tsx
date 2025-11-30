import React, { useState, useEffect } from 'react';
import { BudgetMonth, Transaction } from '@shared/api';
import { BudgetHeader } from './Header';
import { SummaryCards } from "./SummaryCards";
import { Charts } from "./Charts";
import { Footer } from "../Footer";
import { useToast } from "@/components/ui/use-toast";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function Dashboard() {
  const [budget, setBudget] = useState<BudgetMonth | null>(null);
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);

  const fetchBudget = async (selectedMonth: string, selectedYear: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/budget?month=${selectedMonth}&year=${selectedYear}`);
      const result = await response.json();
      if (result.success) {
        setBudget(result.data);
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget(month, year);
  }, [month, year]);

  const handleMonthChange = (newMonth: string, newYear: number) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleAddTransaction = async (category: string, name: string, planned: number, actual: number) => {
    try {
      const response = await fetch(`/api/budget/transaction?month=${month}&year=${year}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, planned, actual, category }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchBudget(month, year);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleEditTransaction = async (id: string, name: string, planned: number, actual: number) => {
    try {
      const response = await fetch(`/api/budget/transaction?month=${month}&year=${year}&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, planned, actual }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchBudget(month, year);
      }
    } catch (error) {
      console.error('Error editing transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/budget/transaction?month=${month}&year=${year}&id=${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await fetchBudget(month, year);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleUpdateRollover = async (rolloverPlanned: number, rolloverActual: number) => {
    try {
      const response = await fetch(`/api/budget?month=${month}&year=${year}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolloverPlanned, rolloverActual }),
      });
      const result = await response.json();
      if (result.success) {
        setBudget(result.data);
      }
    } catch (error) {
      console.error('Error updating rollover:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-budget-header"></div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-500">Failed to load budget data.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-budget-header text-white rounded-lg hover:bg-budget-header/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const getCategoryItems = (category: string): Transaction[] => {
    return budget.transactions.filter(t => t.category === category);
  };

  const calculateCategoryTotal = (category: string) => {
    return getCategoryItems(category).reduce((sum, item) => sum + item.actual, 0);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      BDT: '৳',
    };
    return symbols[currency] || '$';
  };

  const symbol = getCurrencySymbol(currency);

  const incomeTotal = calculateCategoryTotal('income');
  const expensesTotal = calculateCategoryTotal('expenses');
  const billsTotal = calculateCategoryTotal('bills');
  const savingsTotal = calculateCategoryTotal('savings');
  const debtTotal = calculateCategoryTotal('debt');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BudgetHeader
        month={month}
        year={year}
        onMonthChange={handleMonthChange}
        currency={currency}
        onCurrencyChange={setCurrency}
      />

      <SummaryCards
        income={incomeTotal}
        expenses={expensesTotal}
        bills={billsTotal}
        savings={savingsTotal}
        debt={debtTotal}
        currency={currency}
      />

      <div className="w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Financial Overview Table */}
            <div className="bg-gradient-to-br from-budget-header/20 to-budget-header/10 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <h2 className="font-serif font-bold text-lg px-6 py-4 bg-gradient-to-r from-budget-header/30 to-budget-header/10 uppercase tracking-wide">
                Financial Overview
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-budget-header/30">
                      <th className="text-left font-sans font-bold text-gray-700 dark:text-gray-300 py-3 px-6 min-w-[120px] uppercase text-xs">Category</th>
                      <th className="text-right font-sans font-bold text-gray-700 dark:text-gray-300 py-3 px-6 whitespace-nowrap uppercase text-xs">Planned</th>
                      <th className="text-right font-sans font-bold text-gray-700 dark:text-gray-300 py-3 px-6 whitespace-nowrap uppercase text-xs">Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-6 font-sans text-gray-700 dark:text-gray-300">• Income</td>
                      <td className="py-3 px-6 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {symbol}{getCategoryItems('income').reduce((sum, item) => sum + item.planned, 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {symbol}{incomeTotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-6 font-sans text-gray-700 dark:text-gray-300">• Expenses</td>
                      <td className="py-3 px-6 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {symbol}{getCategoryItems('expenses').reduce((sum, item) => sum + item.planned, 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {symbol}{expensesTotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-6 font-sans text-gray-700 dark:text-gray-300">• Bills</td>
                      <td className="py-3 px-6 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {symbol}{getCategoryItems('bills').reduce((sum, item) => sum + item.planned, 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {symbol}{billsTotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-6 font-sans text-gray-700 dark:text-gray-300">• Savings</td>
                      <td className="py-3 px-6 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {symbol}{getCategoryItems('savings').reduce((sum, item) => sum + item.planned, 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {symbol}{savingsTotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-6 font-sans text-gray-700 dark:text-gray-300">• Debt</td>
                      <td className="py-3 px-6 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {symbol}{getCategoryItems('debt').reduce((sum, item) => sum + item.planned, 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {symbol}{debtTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-budget-header/30 bg-gradient-to-r from-budget-header/10 to-transparent">
                      <td className="py-3 px-6 font-sans font-bold text-gray-800 dark:text-gray-200 uppercase text-xs">Left</td>
                      <td className="py-3 px-6 text-right font-sans font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {symbol}{(getCategoryItems('income').reduce((sum, item) => sum + item.planned, 0) - (getCategoryItems('expenses').reduce((sum, item) => sum + item.planned, 0) + getCategoryItems('bills').reduce((sum, item) => sum + item.planned, 0) + getCategoryItems('savings').reduce((sum, item) => sum + item.planned, 0) + getCategoryItems('debt').reduce((sum, item) => sum + item.planned, 0))).toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right font-sans font-bold whitespace-nowrap">
                        <span className={incomeTotal - (expensesTotal + billsTotal + savingsTotal + debtTotal) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {symbol}{(incomeTotal - (expensesTotal + billsTotal + savingsTotal + debtTotal)).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Income Table */}
            <BudgetTable
              title="Income"
              category="income"
              items={getCategoryItems('income')}
              currency={currency}
              bgColor="from-budget-header/20 to-budget-header/10"
              onAddItem={(name, planned, actual) => handleAddTransaction('income', name, planned, actual)}
              onEditItem={handleEditTransaction}
              onDeleteItem={handleDeleteTransaction}
            />
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            <BudgetCharts budget={budget} currency={currency} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Expenses Table */}
            <BudgetTable
              title="Expenses"
              category="expenses"
              items={getCategoryItems('expenses')}
              currency={currency}
              bgColor="from-budget-expense/20 to-budget-expense/10"
              onAddItem={(name, planned, actual) => handleAddTransaction('expenses', name, planned, actual)}
              onEditItem={handleEditTransaction}
              onDeleteItem={handleDeleteTransaction}
            />

            {/* Bills Table */}
            <BudgetTable
              title="Bills"
              category="bills"
              items={getCategoryItems('bills')}
              currency={currency}
              bgColor="from-budget-bill/20 to-budget-bill/10"
              onAddItem={(name, planned, actual) => handleAddTransaction('bills', name, planned, actual)}
              onEditItem={handleEditTransaction}
              onDeleteItem={handleDeleteTransaction}
            />

            {/* Savings Table */}
            <BudgetTable
              title="Savings"
              category="savings"
              items={getCategoryItems('savings')}
              currency={currency}
              bgColor="from-budget-savings/20 to-budget-savings/10"
              onAddItem={(name, planned, actual) => handleAddTransaction('savings', name, planned, actual)}
              onEditItem={handleEditTransaction}
              onDeleteItem={handleDeleteTransaction}
            />

            {/* Debt Table */}
            <BudgetTable
              title="Debt"
              category="debt"
              items={getCategoryItems('debt')}
              currency={currency}
              bgColor="from-budget-debt/20 to-budget-debt/10"
              onAddItem={(name, planned, actual) => handleAddTransaction('debt', name, planned, actual)}
              onEditItem={handleEditTransaction}
              onDeleteItem={handleDeleteTransaction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
