
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Goal } from "@shared/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";

export function useGoals() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();
    const userId = user?.id;

    const fetchGoals = async () => {
        const res = await fetch("/api/goals");
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        return json.data as Goal[];
    };

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

    const goalsKey = `goals-${userId}`;

    const { data: goals, isLoading, error } = useQuery({
        queryKey: ['goals', userId],
        queryFn: fetchGoals,
        staleTime: 0,
        initialData: () => getCachedData(goalsKey),
        enabled: !!userId,
    });

    useEffect(() => {
        if (goals && goals.length > 0) setCachedData(goalsKey, goals);
    }, [goals, goalsKey]);

    const createGoalMutation = useMutation({
        mutationFn: async (goal: Partial<Goal>) => {
            const res = await fetch("/api/goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(goal),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals', userId] });
            toast({ title: "Success", description: "Goal created successfully." });
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const updateGoalMutation = useMutation({
        mutationFn: async (goal: Partial<Goal>) => {
            if (!goal.id) throw new Error("Goal ID required");
            const res = await fetch(`/api/goals/${goal.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(goal),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals', userId] });
            toast({ title: "Success", description: "Goal updated successfully." });
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const deleteGoalMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/goals/${id}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            return json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals', userId] });
            toast({ title: "Success", description: "Goal deleted successfully." });
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    return {
        goals: goals || [],
        isLoading,
        error,
        createGoal: createGoalMutation.mutate,
        updateGoal: updateGoalMutation.mutate,
        deleteGoal: deleteGoalMutation.mutate,
    };
}
