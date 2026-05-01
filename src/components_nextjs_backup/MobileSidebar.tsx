
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export function MobileSidebar({ shopName }: { shopName?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setIsOpen(true)}
                aria-label="Open navigation menu"
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Sidebar Panel */}
                    <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 animate-in slide-in-from-left duration-200 ease-in-out">
                        <div className="absolute top-3 right-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close navigation menu"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <DashboardSidebar shopName={shopName} />
                    </div>
                </div>
            )}
        </>
    );
}
