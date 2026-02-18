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
    Users,
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
    "family": Users,
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

export const getCategoryIcon = (category: string, customIconName?: string): LucideIcon => {
    // If a custom icon name is provided, resolve it first
    if (customIconName) {
        const resolved = ICON_NAME_MAP[customIconName];
        if (resolved) return resolved;
    }
    const key = category.toLowerCase();
    return CATEGORY_ICON_MAP[key] || CircleDollarSign;
};

// Export the map for use in category management UI
export const getAllCategoryIcons = () => CATEGORY_ICON_MAP;

// Map of icon names to their components for custom category icon selection
const ICON_NAME_MAP: Record<string, LucideIcon> = {
    "Utensils": Utensils,
    "ShoppingBag": ShoppingBag,
    "Home": Home,
    "Gamepad2": Gamepad2,
    "Heart": Heart,
    "Banknote": Banknote,
    "PiggyBank": PiggyBank,
    "Car": Car,
    "Zap": Zap,
    "Plane": Plane,
    "GraduationCap": GraduationCap,
    "CircleDollarSign": CircleDollarSign,
    "Cookie": Cookie,
    "Shirt": Shirt,
    "Wrench": Wrench,
    "Briefcase": Briefcase,
    "Cloud": Cloud,
    "Globe": Globe,
    "Code": Code,
    "Tv": Tv,
    "ShoppingCart": ShoppingCart,
    "Wifi": Wifi,
    "Fuel": Fuel,
    "Gift": Gift,
    "Shield": Shield,
    "Send": Send,
    "Coffee": Coffee,
    "Sparkles": Sparkles,
    "Baby": Baby,
    "Dog": Dog,
    "Dumbbell": Dumbbell,
    "Palette": Palette,
    "Scissors": Scissors,
    "Phone": Phone,
    "Headphones": Headphones,
    "Laptop": Laptop,
    "CreditCard": CreditCard,
    "Receipt": Receipt,
    "HandCoins": HandCoins,
    "Wallet": Wallet,
    "TrendingUp": TrendingUp,
    "PartyPopper": PartyPopper,
    "GlassWater": GlassWater,
    "Popcorn": Popcorn,
    "UtensilsCrossed": UtensilsCrossed,
    "Users": Users,
};

// Curated list for the icon picker UI, grouped by semantic meaning
export const ICON_PICKER_OPTIONS: { name: string; icon: LucideIcon }[] = [
    { name: "Utensils", icon: Utensils },
    { name: "UtensilsCrossed", icon: UtensilsCrossed },
    { name: "Coffee", icon: Coffee },
    { name: "Cookie", icon: Cookie },
    { name: "GlassWater", icon: GlassWater },
    { name: "ShoppingCart", icon: ShoppingCart },
    { name: "ShoppingBag", icon: ShoppingBag },
    { name: "Shirt", icon: Shirt },
    { name: "Home", icon: Home },
    { name: "Zap", icon: Zap },
    { name: "Wifi", icon: Wifi },
    { name: "Phone", icon: Phone },
    { name: "Car", icon: Car },
    { name: "Fuel", icon: Fuel },
    { name: "Plane", icon: Plane },
    { name: "Heart", icon: Heart },
    { name: "Dumbbell", icon: Dumbbell },
    { name: "Sparkles", icon: Sparkles },
    { name: "Scissors", icon: Scissors },
    { name: "Baby", icon: Baby },
    { name: "Dog", icon: Dog },
    { name: "GraduationCap", icon: GraduationCap },
    { name: "Laptop", icon: Laptop },
    { name: "Headphones", icon: Headphones },
    { name: "Gamepad2", icon: Gamepad2 },
    { name: "Popcorn", icon: Popcorn },
    { name: "PartyPopper", icon: PartyPopper },
    { name: "Palette", icon: Palette },
    { name: "Banknote", icon: Banknote },
    { name: "Wallet", icon: Wallet },
    { name: "CreditCard", icon: CreditCard },
    { name: "PiggyBank", icon: PiggyBank },
    { name: "TrendingUp", icon: TrendingUp },
    { name: "Receipt", icon: Receipt },
    { name: "HandCoins", icon: HandCoins },
    { name: "Gift", icon: Gift },
    { name: "Shield", icon: Shield },
    { name: "Send", icon: Send },
    { name: "Cloud", icon: Cloud },
    { name: "Globe", icon: Globe },
    { name: "Code", icon: Code },
    { name: "Tv", icon: Tv },
    { name: "Briefcase", icon: Briefcase },
    { name: "Wrench", icon: Wrench },
    { name: "Users", icon: Users },
    { name: "CircleDollarSign", icon: CircleDollarSign },
];

export const getIconByName = (name: string): LucideIcon => {
    return ICON_NAME_MAP[name] || CircleDollarSign;
};
