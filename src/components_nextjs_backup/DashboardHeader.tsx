
"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardHeader() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="flex h-16 items-center border-b px-4 lg:px-6 bg-background relative z-50">
            <div className="flex items-center gap-4 lg:hidden">
                <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                <span className="font-bold">Billing Tool</span>
            </div>

            {isOpen && (
                <div className="absolute top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-background border-r shadow-lg lg:hidden">
                    <DashboardSidebar />
                </div>
            )}

            <div className="ml-auto flex items-center gap-4 hidden lg:flex">
                <div className="text-sm text-muted-foreground">Admin Dashboard</div>
            </div>
        </header>
    );
}
