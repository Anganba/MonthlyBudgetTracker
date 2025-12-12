import React, { useState } from 'react';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { Transaction } from '@shared/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface BudgetTableProps {
  title: string;
  category: string;
  items: Transaction[];
  currency: string;
  bgColor: string;
  onAddItem?: (name: string, planned: number, actual: number) => void;
  onEditItem: (id: string, name: string, planned: number, actual: number) => void;
  onDeleteItem: (id: string) => void;
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

const formatCurrency = (value: number) => {
  return value.toFixed(2);
};

export function BudgetTable({
  title,
  category,
  items,
  currency,
  bgColor,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: BudgetTableProps) {

  const symbol = getCurrencySymbol(currency);
  const totalPlanned = items.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = items.reduce((sum, item) => sum + item.actual, 0);

  return (
    <div className={`bg-card border border-border rounded-xl p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-bold text-lg text-card-foreground">{title}</h2>
        {/* We can remove the local add button or make it trigger the global one if passed a handler */}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-sans font-semibold text-muted-foreground py-2 min-w-[100px]">
                Date
              </th>
              <th className="text-left font-sans font-semibold text-muted-foreground py-2 min-w-[120px]">
                Item/Description
              </th>
              <th className="text-left font-sans font-semibold text-muted-foreground py-2 min-w-[100px]">
                Category
              </th>
              <th className="text-right font-sans font-semibold text-muted-foreground py-2 whitespace-nowrap px-2">
                Planned
              </th>
              <th className="text-right font-sans font-semibold text-muted-foreground py-2 whitespace-nowrap px-2">
                Actual
              </th>
              <th className="text-right font-sans font-semibold text-muted-foreground py-2 w-16 no-print">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition">
                <td className="py-3 font-sans text-muted-foreground min-w-[100px] whitespace-nowrap">
                  {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                </td>
                <td className="py-3 font-sans font-medium text-foreground min-w-[120px] whitespace-nowrap">
                  {item.name}
                </td>
                <td className="py-3 font-sans text-muted-foreground min-w-[100px] whitespace-nowrap">
                  {item.category}
                </td>
                <td className="py-3 text-right font-sans text-foreground whitespace-nowrap px-2">
                  {symbol}{formatCurrency(item.planned)}
                </td>
                <td className="py-3 text-right font-sans text-foreground whitespace-nowrap px-2">
                  {symbol}{formatCurrency(item.actual)}
                </td>
                <td className="py-3 flex justify-end gap-2 no-print">
                  <button
                    onClick={() => onEditItem(item.id, item.name, item.planned, item.actual)}
                    className="p-1 hover:bg-yellow-100 text-yellow-600 rounded transition"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 hover:bg-red-100 text-red-600 rounded transition"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 dark:border-gray-600">
              <td className="py-3 font-sans font-bold text-gray-800 dark:text-gray-200">
                Total
              </td>
              <td></td>
              <td></td>
              <td className="py-3 text-right font-sans font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap px-2">
                {symbol}{formatCurrency(totalPlanned)}
              </td>
              <td className="py-3 text-right font-sans font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap px-2">
                {symbol}{formatCurrency(totalActual)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
