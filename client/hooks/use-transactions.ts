
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction, BudgetMonth } from "@shared/api";
import { useToast } from "@/hooks/use-toast";

interface GoalDeduction {
    goalId: string;
    amount: number;
}

interface CreateTransactionData {
    name: string;
    amount?: number; // legacy support if needed
    actual: number;
    planned: number;
    category: string;
    type: 'income' | 'expense' | 'transfer' | 'savings';
    date: string;
    timestamp?: string; // HH:MM:SS format
    walletId?: string;
    toWalletId?: string;
    goalId?: string;
    goalDeductions?: GoalDeduction[]; // For deducting from goals when withdrawing from savings wallet
}

// Context for optimistic update rollback
interface MutationContext {
    previousBudgets: Map<string, BudgetMonth | null | undefined>;
}

export function useTransactions() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { mutate: createTransaction, isPending: isCreating } = useMutation({
        mutationFn: async (data: CreateTransactionData) => {
            const response = await fetch('/api/budget/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Failed to create transaction');
            }
            return result.data;
        },

        // Optimistic update: runs BEFORE the API call
        onMutate: async (newTransaction: CreateTransactionData): Promise<MutationContext> => {
            // Cancel any outgoing refetches to prevent race conditions
            await queryClient.cancelQueries({ queryKey: ['budget'] });

            // Snapshot current budget data for potential rollback
            const previousBudgets = new Map<string, BudgetMonth | null | undefined>();

            // Get all budget queries from the cache
            const budgetQueries = queryClient.getQueriesData<BudgetMonth>({ queryKey: ['budget'] });
            budgetQueries.forEach(([queryKey, data]) => {
                previousBudgets.set(JSON.stringify(queryKey), data);
            });

            // Create optimistic transaction with temporary ID
            const optimisticTransaction: Transaction = {
                id: `temp-${Date.now()}`,
                name: newTransaction.name,
                actual: newTransaction.actual,
                planned: newTransaction.planned,
                category: newTransaction.category,
                type: newTransaction.type,
                date: newTransaction.date,
                timestamp: newTransaction.timestamp,
                walletId: newTransaction.walletId,
                toWalletId: newTransaction.toWalletId,
                goalId: newTransaction.goalId,
            };

            // Parse the transaction date to determine which budget to update
            const txDate = new Date(newTransaction.date);
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            const txMonth = monthNames[txDate.getMonth()];
            const txYear = txDate.getFullYear();

            // Update the cache optimistically
            queryClient.setQueriesData<BudgetMonth>(
                { queryKey: ['budget'] },
                (oldBudget) => {
                    if (!oldBudget) return oldBudget;

                    // Check if this budget matches the transaction's month/year
                    if (oldBudget.month === txMonth && oldBudget.year === txYear) {
                        return {
                            ...oldBudget,
                            transactions: [optimisticTransaction, ...(oldBudget.transactions || [])],
                        };
                    }
                    return oldBudget;
                }
            );

            // Show immediate success feedback
            toast({
                title: "Transaction added",
                description: "Your transaction has been recorded.",
            });

            // Return context for potential rollback
            return { previousBudgets };
        },

        // On error: rollback to previous state
        onError: (error, _newTransaction, context) => {
            // Rollback to previous budget data
            if (context?.previousBudgets) {
                context.previousBudgets.forEach((data, queryKeyStr) => {
                    const queryKey = JSON.parse(queryKeyStr);
                    queryClient.setQueryData(queryKey, data);
                });
            }

            toast({
                title: "Error",
                description: error.message || "Failed to add transaction. Please try again.",
                variant: "destructive",
            });
        },

        // On settled: always refetch to ensure server/client sync
        onSettled: () => {
            // Refetch all related data to ensure consistency
            // Use a slight delay to avoid UI flicker
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['budget'] });
                queryClient.invalidateQueries({ queryKey: ['wallets'] });
                queryClient.invalidateQueries({ queryKey: ['goals'] });
                queryClient.invalidateQueries({ queryKey: ['monthlyStats'] });
                queryClient.invalidateQueries({ queryKey: ['yearlyStats'] });
            }, 100);
        },
    });

    return {
        createTransaction,
        isCreating
    };
}
