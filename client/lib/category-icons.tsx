import {
    Utensils,
    ShoppingBag,
    Home,
    Gamepad2,
    Heart,
    Banknote,
    PiggyBank,
    Car,
    Zap,
    Plane,
    GraduationCap,
    CircleDollarSign,
    Cookie,
    Pizza,
    Shirt,
    Wrench,
    Briefcase
} from "lucide-react";

export const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
        case 'food': return Utensils;
        case 'lunch': return Utensils;
        case 'breakfast': return Utensils;
        case 'dinner': return Utensils;

        case 'snacks': return Cookie; // Or Pizza if better for "snack item sign"

        case 'shopping':
        case 'gadgets':
        case 'games':
            return ShoppingBag;

        case 'cosmetics': return Shirt; // Could look for something better like Smile/User? Shirt fits for personal shopping often.
        case 'clothes': return Shirt;

        case 'rent':
            return Home;

        case 'entertainment': return Gamepad2;

        case 'health':
        case 'health/medical':
            return Heart;

        case 'paycheck':
        case 'bonus':
        case 'income':
        case 'debt added':
        case 'salary':
            return Banknote;

        case 'savings': return PiggyBank;

        case 'transportation':
        case 'rixa bhara': // Handling user specific case potentially
            return Car;

        case 'utilities': return Zap;

        case 'travel': return Plane;

        case 'personal': return Briefcase; // Or User

        case 'miscellaneous': return Wrench;

        default: return CircleDollarSign;
    }
};
