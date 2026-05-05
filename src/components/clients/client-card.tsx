"use client";

import { getAvatarColor, cn } from "@/lib/utils";
import { type Client } from "@/lib/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreHorizontal, Mail, PhoneCall, File } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientCardProps {
    client: Client;
    onClick: () => void;
    onEdit: (client: Client) => void;
    onDelete: (id: string, name: string) => void;
}

export function ClientCard({ client, onClick, onEdit, onDelete }: ClientCardProps) {
    return (
        <Card
            className="glass-main border-white/10 overflow-hidden hover:border-primary/40 transition-all duration-300 group cursor-pointer relative rounded-3xl shadow-lg hover:shadow-primary/5"
            onClick={onClick}
        >
            <CardHeader className="pb-5 relative px-6 pt-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white bg-gradient-to-br shadow-lg", getAvatarColor(client.name))}>
                            {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <CardTitle className="text-xl text-white group-hover:text-primary transition-colors font-bold tracking-tight">{client.name}</CardTitle>
                            <CardDescription className="text-slate-500 text-xs mt-1">
                                Member since {new Date(client.created_at).toLocaleDateString()}
                            </CardDescription>
                        </div>
                    </div>

                    <DropdownMenu>
                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all relative z-10">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                        </div>
                        <DropdownMenuContent align="end" className="bg-[#0A0B0E] border-white/10 text-slate-200 w-48 p-2 rounded-xl">
                            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500">Client Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5 mx-1" />
                            <DropdownMenuItem onClick={() => onEdit(client)} className="cursor-pointer hover:bg-white/5 px-3 py-2.5 rounded-lg transition-colors flex items-center">
                                <Edit className="w-4 h-4 mr-3 text-slate-400" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(client.id, client.name)} className="cursor-pointer text-red-400 hover:bg-red-400/10 hover:text-red-300 px-3 py-2.5 rounded-lg transition-colors flex items-center mt-1">
                                <Trash2 className="w-4 h-4 mr-3" /> Delete Contact
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6">
                <div className="space-y-3 text-sm text-slate-300">
                    {client.email && (
                        <div className="flex items-center gap-3 group/item">
                            <div className="p-1.5 bg-white/5 rounded-lg group-hover/item:bg-primary/10 transition-colors">
                                <Mail className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-primary" />
                            </div>
                            <a href={`mailto:${client.email}`} className="hover:text-primary transition-colors truncate font-medium">{client.email}</a>
                        </div>
                    )}
                    {client.phone && (
                        <div className="flex items-center gap-3 group/item">
                            <div className="p-1.5 bg-white/5 rounded-lg group-hover/item:bg-primary/10 transition-colors">
                                <PhoneCall className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-primary" />
                            </div>
                            <a href={`tel:${client.phone}`} className="hover:text-primary transition-colors font-medium">{client.phone}</a>
                        </div>
                    )}
                    {client.notes && (
                        <div className="flex items-start gap-3 pt-3 border-t border-white/5 mt-3">
                            <div className="p-1.5 bg-white/5 rounded-lg mt-0.5">
                                <File className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <p className="line-clamp-2 text-xs text-slate-400 leading-relaxed italic">"{client.notes}"</p>
                        </div>
                    )}
                </div>

                {client.tags && client.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {client.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="bg-white/5 hover:bg-white/10 text-slate-400 border-white/5 text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-tight">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-all duration-700" />
        </Card>
    );
}
