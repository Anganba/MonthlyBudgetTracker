export interface DemoResponse {
  message: string;
}

export type TransactionCategory = 'income' | 'expenses' | 'bills' | 'savings' | 'debt';

export interface Transaction {
  id: string;
  name: string;
  planned: number;
  actual: number;
  category: TransactionCategory;
}

export interface BudgetMonth {
  id: string;
  userId?: string;
  month: string;
  year: number;
  rolloverPlanned: number;
  rolloverActual: number;
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

export interface BudgetListResponse {
  success: boolean;
  data?: BudgetMonth[];
  message?: string;
}
