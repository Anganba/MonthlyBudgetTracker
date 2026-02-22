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

    // Get initials for avatar fallback (prefer displayName over username)
    const initials = user?.displayName
        ? user.displayName.substring(0, 2).toUpperCase()
        : user?.username
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
                    <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0">
                        <Avatar className="h-12 w-12 border-2 border-primary/30 shadow-lg shadow-primary/10">
                            <AvatarImage src={user?.avatarUrl} alt={user?.displayName || user?.username} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-emerald-500/20 text-primary font-bold text-lg">{initials}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.displayName || user?.username}</p>
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
                        <span>Sign out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Dialog */}
            <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
        </div>
    );
}
