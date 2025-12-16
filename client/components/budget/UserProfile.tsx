import { useState } from "react";
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
import { LogOut, User, Download, Repeat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export function UserProfile() {
    const { user, logout } = useAuth();
    const { budget } = useBudget();

    const navigate = useNavigate();
    const { toast } = useToast();

    // Get initials for avatar fallback
    const initials = user?.username
        ? user.username.substring(0, 2).toUpperCase()
        : "U";

    const handleLogout = () => {
        logout();
        // navigate("/login"); // Auth context handles state, but redirect might be safe
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/budget/all');
            const result = await response.json();

            if (!result.success || !result.data || result.data.length === 0) {
                toast({ title: "Export Failed", description: "No transactions found to export.", variant: "destructive" });
                return;
            }

            const transactions = result.data;
            const headers = ["Date", "Name", "Category", "Amount", "Type"];
            const incomeCategories = ['Paycheck', 'Bonus', 'Debt Added', 'income'];

            const rows = transactions.map((t: any) => {
                const isIncome = incomeCategories.includes(t.category);
                const isSavings = t.category === 'Savings';
                let type = "Expense";
                if (isIncome) type = "Income";
                else if (isSavings) type = "Savings";

                return [
                    t.date,
                    t.name,
                    t.category,
                    Math.abs(t.actual).toString(),
                    type
                ];
            });

            const escapeCsvField = (field: string) => {
                if (field === null || field === undefined) return '';
                const stringField = String(field);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            };

            const csvContent = "data:text/csv;charset=utf-8,"
                + headers.join(",") + "\n"
                + rows.map((row: any[]) => row.map(escapeCsvField).join(",")).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `budget_export_all_history.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: "Export Successful", description: "Your transaction history has been downloaded." });

        } catch (error) {
            console.error("Export error:", error);
            toast({ title: "Export Failed", description: "Could not fetch data.", variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
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
                    <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>{isExporting ? "Exporting..." : "Export Data"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/recurring")}>
                        <Repeat className="mr-2 h-4 w-4" />
                        <span>Recurring</span>
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
