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
  onAddItem: (name: string, planned: number, actual: number) => void;
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', planned: '', actual: '' });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onAddItem(formData.name, parseFloat(formData.planned) || 0, parseFloat(formData.actual) || 0);
      setFormData({ name: '', planned: '', actual: '' });
      setIsAddDialogOpen(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && editingId) {
      onEditItem(editingId, formData.name, parseFloat(formData.planned) || 0, parseFloat(formData.actual) || 0);
      setFormData({ name: '', planned: '', actual: '' });
      setEditingId(null);
      setIsEditDialogOpen(false);
    }
  };

  const openEditDialog = (item: Transaction) => {
    setFormData({ name: item.name, planned: item.planned.toString(), actual: item.actual.toString() });
    setEditingId(item.id);
    setIsEditDialogOpen(true);
  };

  const symbol = getCurrencySymbol(currency);
  const totalPlanned = items.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = items.reduce((sum, item) => sum + item.actual, 0);

  return (
    <div className={`bg-gradient-to-br ${bgColor} border border-gray-200 dark:border-gray-700 rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-bold text-lg">{title}</h2>
        <button
          onClick={() => {
            setFormData({ name: '', planned: '', actual: '' });
            setIsAddDialogOpen(true);
          }}
          className="p-2 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition no-print"
          aria-label={`Add ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="text-left font-sans font-semibold text-gray-700 dark:text-gray-300 py-2 min-w-[120px]">
                Category
              </th>
              <th className="text-right font-sans font-semibold text-gray-700 dark:text-gray-300 py-2 whitespace-nowrap px-2">
                Planned
              </th>
              <th className="text-right font-sans font-semibold text-gray-700 dark:text-gray-300 py-2 whitespace-nowrap px-2">
                Actual
              </th>
              <th className="text-right font-sans font-semibold text-gray-700 dark:text-gray-300 py-2 w-16 no-print">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <td className="py-3 font-sans font-medium text-gray-800 dark:text-gray-200 min-w-[120px] whitespace-nowrap">
                  {item.name}
                </td>
                <td className="py-3 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap px-2">
                  {symbol}{formatCurrency(item.planned)}
                </td>
                <td className="py-3 text-right font-sans text-gray-700 dark:text-gray-300 whitespace-nowrap px-2">
                  {symbol}{formatCurrency(item.actual)}
                </td>
                <td className="py-3 flex justify-end gap-2 no-print">
                  <button
                    onClick={() => openEditDialog(item)}
                    className="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-700 rounded transition"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 hover:bg-red-200 dark:hover:bg-red-700 rounded transition"
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Add New {title}</DialogTitle>
            <DialogDescription>
              Enter the details for the new {title.toLowerCase()} item below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-sans font-medium text-gray-700 dark:text-gray-300 mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Groceries, Rent, etc."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-budget-header"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-sans font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Planned Amount
                </label>
                <input
                  type="number"
                  value={formData.planned}
                  onChange={(e) => setFormData({ ...formData, planned: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-budget-header"
                />
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Actual Amount
                </label>
                <input
                  type="number"
                  value={formData.actual}
                  onChange={(e) => setFormData({ ...formData, actual: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-budget-header"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setFormData({ name: '', planned: '', actual: '' });
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition"
              >
                Add Item
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit {title}</DialogTitle>
            <DialogDescription>
              Update the details for this {title.toLowerCase()} item.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-sans font-medium text-gray-700 dark:text-gray-300 mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Item name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-budget-header"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-sans font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Planned Amount
                </label>
                <input
                  type="number"
                  value={formData.planned}
                  onChange={(e) => setFormData({ ...formData, planned: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-budget-header"
                />
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Actual Amount
                </label>
                <input
                  type="number"
                  value={formData.actual}
                  onChange={(e) => setFormData({ ...formData, actual: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-budget-header"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingId(null);
                  setFormData({ name: '', planned: '', actual: '' });
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition"
              >
                Save Changes
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
