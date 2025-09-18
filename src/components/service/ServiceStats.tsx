import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ServiceStatsProps {
    stats: { pendingCount: number; inProgressCount: number; doneCount: number; totalServices: number };
    loading: boolean;
}

export function ServiceStats({ stats, loading }: ServiceStatsProps) {
    const items = [
        { label: "Pending Services", value: stats.pendingCount },
        { label: "In Progress", value: stats.inProgressCount },
        { label: "Completed Services", value: stats.doneCount },
        { label: "Total Services", value: stats.totalServices },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map((item, idx) => (
                <Card key={idx} className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
                    <div>
                        <div className="text-lg sm:text-2xl font-bold text-foreground">
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : item.value}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{item.label}</div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
