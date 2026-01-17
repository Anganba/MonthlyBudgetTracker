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
  isSavingsWallet?: boolean;
  createdAt?: string;
}

export type TransactionCategory = string;

export interface Transaction {
  id: string;
  name: string;
  type?: 'expense' | 'income' | 'transfer' | 'savings';
  planned: number;
  actual: number;
  category: TransactionCategory;
  date: string;
  timestamp?: string; // HH:MM:SS format for sorting and history tracking
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

export type GoalCategory = 'car' | 'travel' | 'home' | 'electronics' | 'education' | 'wedding' | 'emergency' | 'gadget' | 'other';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: GoalCategory;
  description?: string;
  color?: string;
  status: 'active' | 'fulfilled' | 'archived';
  completedAt?: string;
  startedAt?: string;
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
  type: 'income' | 'expense';
  category: TransactionCategory;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  time?: string; // HH:mm format for specific execution time
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

export type AuditEntityType = 'wallet' | 'goal' | 'recurring' | 'transaction' | 'profile';

export type AuditChangeType =
  // Wallet changes
  | 'balance_change'
  | 'wallet_created'
  | 'wallet_updated'
  | 'wallet_deleted'
  // Goal changes
  | 'goal_created'
  | 'goal_updated'
  | 'goal_fulfilled'
  | 'goal_reactivated'
  | 'goal_deleted'
  // Recurring changes
  | 'recurring_created'
  | 'recurring_updated'
  | 'recurring_deleted'
  // Transaction changes
  | 'transaction_created'
  | 'transaction_updated'
  | 'transaction_deleted'
  // Profile changes
  | 'password_changed'
  | 'data_exported';

export interface AuditLog {
  id: string;
  userId: string;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  changeType: AuditChangeType;
  previousBalance?: number;
  newBalance?: number;
  changeAmount?: number;
  details?: string;
  reason?: string;
  timestamp: string;
}

// Keep backward compatibility alias
export type WalletAuditLog = AuditLog;

export interface AuditLogResponse {
  success: boolean;
  data?: AuditLog[];
  message?: string;
}

// Keep backward compatibility alias
export type WalletAuditLogResponse = AuditLogResponse;
