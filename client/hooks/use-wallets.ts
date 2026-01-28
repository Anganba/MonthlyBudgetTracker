import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet } from "@shared/api";
import { toast } from "@/components/ui/use-toast";

export function useWallets() {
    const queryClient = useQueryClient();

    const { data: wallets = [], isLoading } = useQuery<Wallet[]>({
        queryKey: ["wallets"],
        queryFn: async () => {
            const res = await fetch("/api/wallets");
            if (!res.ok) throw new Error("Failed to fetch wallets");
            const json = await res.json();
            return json.data;
        },
    });

    const createWallet = useMutation({
        mutationFn: async (wallet: Partial<Wallet>) => {
            const res = await fetch("/api/wallets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(wallet),
            });
            if (!res.ok) throw new Error("Failed to create wallet");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wallets"] });
            toast({ title: "Success", description: "Wallet created successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create wallet", variant: "destructive" });
        },
    });

    const updateWallet = useMutation({
        mutationFn: async ({ id, ...data }: Partial<Wallet> & { id: string }) => {
            const res = await fetch(`/api/wallets/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update wallet");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wallets"] });
            toast({ title: "Success", description: "Wallet updated successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update wallet", variant: "destructive" });
        },
    });

    const deleteWallet = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/wallets/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete wallet");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wallets"] });
            toast({ title: "Success", description: "Wallet deleted successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete wallet", variant: "destructive" });
        },
    });

    const reorderWallets = useMutation({
        mutationFn: async (orderedIds: string[]) => {
            const res = await fetch("/api/wallets/reorder", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderedIds }),
            });
            if (!res.ok) throw new Error("Failed to reorder wallets");
            return res.json();
        },
        onSuccess: () => {
            // Invalidate to ensure other components (like AccountsSection) get the new order
            queryClient.invalidateQueries({ queryKey: ["wallets"] });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to save wallet order", variant: "destructive" });
            queryClient.invalidateQueries({ queryKey: ["wallets"] }); // Revert on error
        },
    });

    return {
        wallets,
        isLoading,
        createWallet,
        updateWallet,
        deleteWallet,
        reorderWallets
    };
}
