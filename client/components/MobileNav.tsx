import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useState } from "react";
import { useLocation, Link } from "react-router-dom";

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    // Close menu on navigation
    const handleNavClick = () => {
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10">
                    <Menu className="h-5 w-5 text-white" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="p-0 bg-black w-[280px] border-r border-white/10"
                onInteractOutside={() => setOpen(false)}
            >
                <div onClick={handleNavClick}>
                    <Sidebar collapsed={false} setCollapsed={() => { }} mobile={true} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
