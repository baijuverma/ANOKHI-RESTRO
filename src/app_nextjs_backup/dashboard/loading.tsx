
import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex h-full min-h-[50vh] flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading dashboard...</p>
        </div>
    );
}
