import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ClientSearchProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

export function ClientSearch({ searchTerm, onSearchChange }: ClientSearchProps) {
    return (
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-4 flex-1 shadow-inner">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                    type="text"
                    placeholder="Search clients by name, email, or tags..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-12 bg-white/5 border-white/5 h-12 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                />
            </div>
        </div>
    );
}
