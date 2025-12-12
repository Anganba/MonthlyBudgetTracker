import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useState } from "react";

export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-black w-64 border-r border-white/10">
                {/* Reusing Sidebar content logic, but we might need to adjust Sidebar to be reusable or just duplicate the nav links here for simplicity if Sidebar is too coupled to desktop state */}
                <Sidebar collapsed={false} setCollapsed={() => { }} mobile={true} />
            </SheetContent>
        </Sheet>
    );
}
