import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ClientFilterProps {
    uniqueTags: string[];
    selectedTag: string;
    onTagChange: (value: string) => void;
}

export function ClientFilter({ uniqueTags, selectedTag, onTagChange }: ClientFilterProps) {
    return (
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:w-72">
            <Select value={selectedTag} onValueChange={onTagChange}>
                <SelectTrigger className="w-full bg-white/5 border-white/5 h-12 text-white focus:border-primary/50 rounded-xl">
                    <SelectValue placeholder="Filter by Tag" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0B0E] border-white/10 text-slate-200">
                    <SelectItem value="all">All Tags</SelectItem>
                    {uniqueTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
