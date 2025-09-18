import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

interface ServiceSearchProps {
    searchTerm: string;
    onChange: (val: string) => void;
}

export function ServiceSearch({ searchTerm, onChange }: ServiceSearchProps) {
    return (
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    placeholder="Search services"
                    value={searchTerm}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-10"
                />
            </div>
        </Card>
    );
}
