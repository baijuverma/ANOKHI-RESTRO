"use client";

import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export function PosHeaderStats() {
    const { items, clearCart } = useCartStore();
    const pathname = usePathname();

    if (pathname !== '/dashboard/pos') return null;

    return (
        <div className="flex items-center gap-3 ml-auto pl-4 border-l">
            <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 hidden xl:block">Current Order</h2>
                <div className="flex items-center justify-center bg-primary text-primary-foreground h-7 w-7 rounded-full text-xs font-extrabold shadow-sm border-2 border-white ring-1 ring-primary/20 animate-in zoom-in duration-300">
                    {items.length}
                </div>
            </div>
            <Button
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700 h-9 px-3 font-bold gap-1.5 shadow-sm shadow-green-600/20"
                onClick={() => {
                    clearCart();
                    toast.success("New Bill Started");
                }}
            >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Bill</span>
            </Button>
        </div>
    )
}
