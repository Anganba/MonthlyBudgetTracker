import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loan, LoanPayment } from "@shared/api";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";

interface CreateLoanData {
    personName: string;
    direction: 'given' | 'received';
    totalAmount: number;
    description?: string;
    walletId?: string;
    date?: string;
    dueDate?: string;
}

interface AddPaymentData {
    loanId: string;
    amount: number;
    date?: string;
    timestamp?: string;
    walletId?: string;
    note?: string;
}

export function useLoans() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const userId = user?.id;

    const getCachedData = (key: string) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : undefined;
        } catch { return undefined; }
    };
    const setCachedData = (key: string, data: any) => {
        try {
            if (data) localStorage.setItem(key, JSON.stringify(data));
        } catch { }
    };

    const loansKey = `loans-${userId}`;

    const { data: loans = [], isLoading } = useQuery<Loan[]>({
        queryKey: ["loans", userId],
        queryFn: async () => {
            const res = await fetch("/api/loans");
            if (!res.ok) throw new Error("Failed to fetch loans");
            const json = await res.json();
            return json.data;
        },
        staleTime: 0,
        initialData: () => getCachedData(loansKey),
        enabled: !!userId,
    });

    useEffect(() => {
        if (loans && loans.length > 0) setCachedData(loansKey, loans);
    }, [loans, loansKey]);

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ["loans"] });
        queryClient.invalidateQueries({ queryKey: ["wallets"] });
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    };

    const createLoan = useMutation({
        mutationFn: async (data: CreateLoanData) => {
            const res = await fetch("/api/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to create loan");
            return json;
        },
        onSuccess: () => {
            invalidateAll();
            toast({ title: "Success", description: "Loan created successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateLoan = useMutation({
        mutationFn: async ({ id, ...data }: { id: string; personName?: string; description?: string; dueDate?: string }) => {
            const res = await fetch(`/api/loans/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to update loan");
            return json;
        },
        onSuccess: () => {
            invalidateAll();
            toast({ title: "Success", description: "Loan updated successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteLoan = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/loans/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to delete loan");
            return json;
        },
        onSuccess: () => {
            invalidateAll();
            toast({ title: "Success", description: "Loan deleted successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const addPayment = useMutation({
        mutationFn: async ({ loanId, ...data }: AddPaymentData) => {
            const res = await fetch(`/api/loans/${loanId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to add payment");
            return json;
        },
        onSuccess: () => {
            invalidateAll();
            toast({ title: "Success", description: "Payment recorded successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const removePayment = useMutation({
        mutationFn: async ({ loanId, paymentId }: { loanId: string; paymentId: string }) => {
            const res = await fetch(`/api/loans/${loanId}/payments/${paymentId}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to remove payment");
            return json;
        },
        onSuccess: () => {
            invalidateAll();
            toast({ title: "Success", description: "Payment removed successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    return {
        loans,
        isLoading,
        createLoan,
        updateLoan,
        deleteLoan,
        addPayment,
        removePayment,
    };
}
