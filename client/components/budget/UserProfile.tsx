import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useBudget } from "@/hooks/use-budget";
import { Bell, LogOut, User, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UserProfile() {
    const { user, logout } = useAuth();
    const { budget } = useBudget();
    const navigate = useNavigate();

    // Get initials for avatar fallback
    const initials = user?.username
        ? user.username.substring(0, 2).toUpperCase()
        : "U";

    const handleLogout = () => {
        logout();
        // navigate("/login"); // Auth context handles state, but redirect might be safe
    };

    const handleExport = () => {
        if (!budget?.transactions || budget.transactions.length === 0) {
            alert("No transactions to export.");
            return;
        }

        const headers = ["Date", "Name", "Category", "Amount", "Type"];
        const rows = budget.transactions.map(t => [
            t.date,
            t.name,
            t.category,
            t.actual.toString(),
            t.actual < 0 ? "Expense" : "Income"
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `budget_export_${budget?.month || 'current'}_${budget?.year || ''}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {/* Notification dot using primary color */}
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            </Button>

            {/* User Avatar & Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 border border-primary/20">
                            <AvatarFallback className="bg-secondary/50 text-primary font-bold border-2 border-primary/20">{initials}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.username}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user?.email || "user@example.com"}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Export Data</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
