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
import { LogOut, User, Download, Repeat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ExportDialog } from "./ExportDialog";

export function UserProfile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    // Get initials for avatar fallback
    const initials = user?.username
        ? user.username.substring(0, 2).toUpperCase()
        : "U";

    const handleLogout = () => {
        logout();
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
                    <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Export Data</span>
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

            {/* Export Dialog */}
            <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
        </div>
    );
}
