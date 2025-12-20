export interface CategoryDef {
    id: string;
    label: string;
    type: 'income' | 'expense' | 'savings';
}

export const TRANSACTION_CATEGORIES: CategoryDef[] = [
    { id: "Bonus", label: "Bonus", type: 'income' },
    { id: "Clothes", label: "Clothes", type: 'expense' },
    { id: "Cosmetics", label: "Cosmetics", type: 'expense' },
    { id: "Debt Added", label: "Debt Added", type: 'income' },
    { id: "Debt Paid", label: "Debt Paid", type: 'expense' },
    { id: "Entertainment", label: "Entertainment", type: 'expense' },
    { id: "Food", label: "Food", type: 'expense' },
    { id: "Gadgets", label: "Gadgets", type: 'expense' },
    { id: "Health/medical", label: "Health/medical", type: 'expense' },
    { id: "Miscellaneous", label: "Miscellaneous", type: 'expense' },
    { id: "Paycheck", label: "Paycheck", type: 'income' },
    { id: "Personal", label: "Personal", type: 'expense' },
    { id: "Remittance", label: "Remittance", type: 'expense' },
    { id: "Rent", label: "Rent", type: 'expense' },
    { id: "Savings", label: "Savings", type: 'savings' },
    { id: "Shopping", label: "Shopping", type: 'expense' },
    { id: "Snacks", label: "Snacks", type: 'expense' },
    { id: "Transportation", label: "Transportation", type: 'expense' },
    { id: "Travel", label: "Travel", type: 'expense' },
    { id: "Utilities", label: "Utilities", type: 'expense' },
];

export const EXPENSE_CATEGORIES = TRANSACTION_CATEGORIES.filter(c => c.type === 'expense');
