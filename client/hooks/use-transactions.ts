
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@shared/api";
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget'] });
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            toast({
                title: "Transaction added",
                description: "Your transaction has been successfully recorded.",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    return {
        createTransaction,
        isCreating
    };
}
