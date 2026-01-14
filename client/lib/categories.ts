export interface CategoryDef {
    id: string;
    label: string;
    type: 'income' | 'expense' | 'savings';
}

export const TRANSACTION_CATEGORIES: CategoryDef[] = [
    // ═══════════════════════════════════════════════════════════════
    // INCOME
    // ═══════════════════════════════════════════════════════════════
    { id: "Bonus", label: "Bonus", type: 'income' },
    { id: "Debt Added", label: "Debt Added", type: 'income' },
    { id: "Freelance", label: "Freelance", type: 'income' },
    { id: "Gifts Received", label: "Gifts Received", type: 'income' },
    { id: "Paycheck", label: "Paycheck", type: 'income' },
    { id: "Refund", label: "Refund", type: 'income' },
    { id: "Side Hustle", label: "Side Hustle", type: 'income' },

    // ═══════════════════════════════════════════════════════════════
    // SAVINGS
    // ═══════════════════════════════════════════════════════════════
    { id: "Savings", label: "Savings", type: 'savings' },

    // ═══════════════════════════════════════════════════════════════
    // TECH & DIGITAL
    // ═══════════════════════════════════════════════════════════════
    { id: "Cloud & Hosting", label: "Cloud & Hosting", type: 'expense' },
    { id: "Courses & Learning", label: "Courses & Learning", type: 'expense' },
    { id: "Domains & Services", label: "Domains & Services", type: 'expense' },
    { id: "Software & Tools", label: "Software & Tools", type: 'expense' },
    { id: "Subscriptions", label: "Subscriptions", type: 'expense' },

    // ═══════════════════════════════════════════════════════════════
    // FOOD & DRINKS
    // ═══════════════════════════════════════════════════════════════
    { id: "Coffee & Drinks", label: "Coffee & Drinks", type: 'expense' },
    { id: "Dining Out", label: "Dining Out", type: 'expense' },
    { id: "Food", label: "Food", type: 'expense' },
    { id: "Groceries", label: "Groceries", type: 'expense' },
    { id: "Snacks", label: "Snacks", type: 'expense' },

    // ═══════════════════════════════════════════════════════════════
    // HOUSING & UTILITIES
    // ═══════════════════════════════════════════════════════════════
    { id: "Internet", label: "Internet", type: 'expense' },
    { id: "Phone & Mobile", label: "Phone & Mobile", type: 'expense' },
    { id: "Rent", label: "Rent", type: 'expense' },
    { id: "Utilities", label: "Utilities", type: 'expense' },

    // ═══════════════════════════════════════════════════════════════
    // TRANSPORTATION
    // ═══════════════════════════════════════════════════════════════
    { id: "Fuel", label: "Fuel", type: 'expense' },
    { id: "Parking", label: "Parking", type: 'expense' },
    { id: "Public Transit", label: "Public Transit", type: 'expense' },
    { id: "Rideshare", label: "Rideshare", type: 'expense' },
    { id: "Transportation", label: "Transportation", type: 'expense' },
    { id: "Travel", label: "Travel", type: 'expense' },
    { id: "Vehicle Maintenance", label: "Vehicle Maintenance", type: 'expense' },

    // ═══════════════════════════════════════════════════════════════
    // PERSONAL & LIFESTYLE
    // ═══════════════════════════════════════════════════════════════
    { id: "Clothes", label: "Clothes", type: 'expense' },
    { id: "Cosmetics", label: "Cosmetics", type: 'expense' },
    { id: "Fitness", label: "Fitness", type: 'expense' },
    { id: "Hobbies", label: "Hobbies", type: 'expense' },
    { id: "Personal", label: "Personal", type: 'expense' },
    { id: "Salon & Grooming", label: "Salon & Grooming", type: 'expense' },
    { id: "Shopping", label: "Shopping", type: 'expense' },

    // ═══════════════════════════════════════════════════════════════
    // ENTERTAINMENT
    // ═══════════════════════════════════════════════════════════════
    { id: "Entertainment", label: "Entertainment", type: 'expense' },
    { id: "Movies & Cinema", label: "Movies & Cinema", type: 'expense' },
    { id: "Music", label: "Music", type: 'expense' },
    { id: "Parties & Events", label: "Parties & Events", type: 'expense' },

    // ═══════════════════════════════════════════════════════════════
    // HEALTH & WELLNESS
    // ═══════════════════════════════════════════════════════════════
    { id: "Health/Medical", label: "Health/Medical", type: 'expense' },
    { id: "Pharmacy", label: "Pharmacy", type: 'expense' },

    // ═══════════════════════════════════════════════════════════════
    // FAMILY & PETS
    // ═══════════════════════════════════════════════════════════════
    { id: "Baby & Kids", label: "Baby & Kids", type: 'expense' },
    { id: "Education", label: "Education", type: 'expense' },
    { id: "Pets", label: "Pets", type: 'expense' },

    // ═══════════════════════════════════════════════════════════════
    // SHOPPING & GADGETS
    // ═══════════════════════════════════════════════════════════════
    { id: "Electronics", label: "Electronics", type: 'expense' },
    { id: "Gadgets", label: "Gadgets", type: 'expense' },
    { id: "Home & Garden", label: "Home & Garden", type: 'expense' },

    // ═══════════════════════════════════════════════════════════════
    // FINANCIAL
    // ═══════════════════════════════════════════════════════════════
    { id: "Bank Fees", label: "Bank Fees", type: 'expense' },
    { id: "Debt Paid", label: "Debt Paid", type: 'expense' },
    { id: "Donations", label: "Donations", type: 'expense' },
    { id: "Gifts", label: "Gifts", type: 'expense' },
    { id: "Insurance", label: "Insurance", type: 'expense' },
    { id: "Investments", label: "Investments", type: 'expense' },
    { id: "Loans Given", label: "Loans Given", type: 'expense' },
    { id: "Remittance", label: "Remittance", type: 'expense' },
    { id: "Taxes", label: "Taxes", type: 'expense' },
    { id: "Tips & Service", label: "Tips & Service", type: 'expense' },

    // ═══════════════════════════════════════════════════════════════
    // GENERAL
    // ═══════════════════════════════════════════════════════════════
    { id: "Miscellaneous", label: "Miscellaneous", type: 'expense' },
];

export const EXPENSE_CATEGORIES = TRANSACTION_CATEGORIES.filter(c => c.type === 'expense');
export const INCOME_CATEGORIES = TRANSACTION_CATEGORIES.filter(c => c.type === 'income');
