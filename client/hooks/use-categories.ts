import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { TRANSACTION_CATEGORIES, CategoryDef } from "@/lib/categories";

export interface CustomCategory {
    id: string;
    label: string;
    type: 'expense' | 'income';
    icon?: string;
}

export function useCategories() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: customCategories = [], isLoading } = useQuery<CustomCategory[]>({
        queryKey: ['custom-categories'],
        queryFn: async () => {
            const res = await fetch('/api/budget/custom-categories');
            if (!res.ok) return [];
            const json = await res.json();
            return json.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });

    // Merge built-in + custom categories
    const allCategories: CategoryDef[] = [
        ...TRANSACTION_CATEGORIES,
        ...customCategories.map(c => ({
            id: c.id,
            label: c.label,
            type: c.type as 'expense' | 'income' | 'savings',
        })),
    ];

    const saveMutation = useMutation({
        mutationFn: async (categories: CustomCategory[]) => {
            const res = await fetch('/api/budget/custom-categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            return json.data;
        },
        onMutate: async (newCategories) => {
            await queryClient.cancelQueries({ queryKey: ['custom-categories'] });
            const previous = queryClient.getQueryData<CustomCategory[]>(['custom-categories']);
            queryClient.setQueryData(['custom-categories'], newCategories);
            return { previous };
        },
        onError: (err, _newCategories, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['custom-categories'], context.previous);
            }
            toast({ title: "Error", description: "Failed to save categories", variant: "destructive" });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['custom-categories'] });
        },
    });

    const addCategory = (category: CustomCategory) => {
        // Check for duplicate
        const exists = customCategories.some(c => c.id.toLowerCase() === category.id.toLowerCase());
        const builtInExists = TRANSACTION_CATEGORIES.some(c => c.id.toLowerCase() === category.id.toLowerCase());
        if (exists || builtInExists) {
            toast({ title: "Duplicate", description: `Category "${category.label}" already exists.`, variant: "destructive" });
            return false;
        }
        saveMutation.mutate([...customCategories, category]);
        return true;
    };

    const removeCategory = (categoryId: string) => {
        saveMutation.mutate(customCategories.filter(c => c.id !== categoryId));
    };

    return {
        customCategories,
        allCategories,
        isLoading,
        addCategory,
        removeCategory,
        isSaving: saveMutation.isPending,
    };
}
