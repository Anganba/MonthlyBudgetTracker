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
    Shirt,
    Wrench,
    Briefcase,
    // New icons for expanded categories
    Cloud,
    Globe,
    Code,
    Tv,
    ShoppingCart,
    Wifi,
    Fuel,
    Gift,
    Shield,
    Send,
    Coffee,
    Sparkles,
    Baby,
    Dog,
    Dumbbell,
    Palette,
    Scissors,
    Phone,
    Headphones,
    Laptop,
    CreditCard,
    Receipt,
    HandCoins,
    Wallet,
    TrendingUp,
    PartyPopper,
    GlassWater,
    Popcorn,
    UtensilsCrossed,
    type LucideIcon
} from "lucide-react";

// Icon mapping for all categories
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    // Income
    "bonus": Banknote,
    "debt added": Banknote,
    "freelance": Laptop,
    "gifts received": Gift,
    "paycheck": Wallet,
    "refund": Receipt,
    "salary": Banknote,
    "side hustle": Briefcase,
    "income": TrendingUp,

    // Savings
    "savings": PiggyBank,

    // Tech & Digital
    "cloud & hosting": Cloud,
    "courses & learning": GraduationCap,
    "domains & services": Globe,
    "software & tools": Code,
    "subscriptions": Tv,

    // Food & Drinks
    "coffee & drinks": Coffee,
    "dining out": UtensilsCrossed,
    "food": Utensils,
    "groceries": ShoppingCart,
    "snacks": Cookie,

    // Housing & Utilities
    "internet": Wifi,
    "phone & mobile": Phone,
    "rent": Home,
    "utilities": Zap,

    // Transportation
    "fuel": Fuel,
    "parking": Car,
    "public transit": Car,
    "rideshare": Car,
    "transportation": Car,
    "travel": Plane,
    "vehicle maintenance": Wrench,

    // Personal & Lifestyle
    "clothes": Shirt,
    "cosmetics": Sparkles,
    "fitness": Dumbbell,
    "hobbies": Palette,
    "personal": Briefcase,
    "salon & grooming": Scissors,
    "shopping": ShoppingBag,

    // Entertainment
    "entertainment": Gamepad2,
    "movies & cinema": Popcorn,
    "music": Headphones,
    "parties & events": PartyPopper,

    // Health & Wellness
    "health/medical": Heart,
    "pharmacy": Heart,

    // Family & Pets
    "baby & kids": Baby,
    "education": GraduationCap,
    "pets": Dog,

    // Shopping & Gadgets
    "electronics": Laptop,
    "gadgets": Laptop,
    "home & garden": Home,

    // Financial
    "bank fees": CreditCard,
    "debt paid": CreditCard,
    "donations": Gift,
    "gifts": Gift,
    "insurance": Shield,
    "investments": TrendingUp,
    "remittance": Send,
    "taxes": Receipt,
    "tips & service": HandCoins,

    // General
    "miscellaneous": Wrench,

    // Aliases for common variations
    "lunch": Utensils,
    "breakfast": Utensils,
    "dinner": Utensils,
    "games": Gamepad2,
    "health": Heart,
    "medical": Heart,
    "transfer": Send,
};

export const getCategoryIcon = (category: string): LucideIcon => {
    const key = category.toLowerCase();
    return CATEGORY_ICON_MAP[key] || CircleDollarSign;
};

// Export the map for use in category management UI
export const getAllCategoryIcons = () => CATEGORY_ICON_MAP;
