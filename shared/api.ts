export interface DemoResponse {
  message: string;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: 'cash' | 'mfs' | 'bank' | 'credit_card' | 'debit_card' | 'virtual_card' | 'other';
  balance: number;
  description?: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export type TransactionCategory = string;

export interface Transaction {
  id: string;
  name: string;
  type?: 'expense' | 'income' | 'transfer';
  planned: number;
  actual: number;
  category: TransactionCategory;
  date: string;
  goalId?: string;
  walletId?: string;
  toWalletId?: string;
}

export interface BudgetMonth {
  id: string;
  userId?: string;
  month: string;
  year: number;
  rolloverPlanned: number;
  rolloverActual: number;
  categoryLimits?: Record<string, number>;
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetResponse {
  success: boolean;
  data?: BudgetMonth;
  message?: string;
}

export interface TransactionResponse {
  success: boolean;
  data?: Transaction;
  message?: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color?: string;
  status: 'active' | 'fulfilled' | 'archived';
  completedAt?: string;
  createdAt?: string;
}

export interface GoalResponse {
  success: boolean;
  data?: Goal;
  message?: string;
}

export interface BudgetListResponse {
  success: boolean;
  data?: BudgetMonth[];
  message?: string;
}
export interface RecurringTransaction {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: TransactionCategory;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  nextRunDate: string;
  lastRunDate?: string;
  active: boolean;
  walletId?: string;
  createdAt?: string;
}

export interface RecurringTransactionResponse {
  success: boolean;
  data?: RecurringTransaction[];
  message?: string;
}
