export interface DemoResponse {
  message: string;
}

export type TransactionCategory = string;

export interface Transaction {
  id: string;
  name: string;
  planned: number;
  actual: number;
  category: TransactionCategory;
  date: string;
  goalId?: string;
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
  createdAt?: string;
}

export interface RecurringTransactionResponse {
  success: boolean;
  data?: RecurringTransaction[];
  message?: string;
}
