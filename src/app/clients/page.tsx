"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useClients, type Client } from "@/lib/hooks/use-clients";
import { ClientDialog } from "@/components/client-dialog";
import { getAvatarColor, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, User, Mail, Edit, Trash2, MoreHorizontal, PhoneCall, File } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ClientsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { clients, loading: clientsLoading, error, createClient, updateClient, deleteClient } = useClients();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState<string>("all");

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    if (authLoading || (clientsLoading && clients.length === 0)) {
        return (
            <div className="flex flex-col min-h-screen bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">
                <Header />
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col min-h-screen bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">
                <Header />
                <div className="flex-1 container mx-auto px-4 pt-32 pb-12 text-center">
                    <div className="max-w-md mx-auto glass-main p-8 border-white/10 rounded-2xl">
                        <User className="w-16 h-16 mx-auto text-primary/40 mb-4" />
                        <h2 className="text-2xl font-bold mb-4 text-white">Sign In Required</h2>
                        <p className="text-gray-400 mb-8">Please sign in to manage your clients and track their journeys.</p>
                        <Button onClick={() => router.push('/auth/login')} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-xl">
                            Sign In to Continue
                        </Button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const uniqueTags = Array.from(new Set(clients.flatMap(c => c.tags || []))).sort();

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesTag = selectedTag === "all" || (c.tags && c.tags.includes(selectedTag));

        return matchesSearch && matchesTag;
    });

    const handleOpenCreate = () => {
        setEditingClient(null);
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (client: Client) => {
        setEditingClient(client);
        setIsDialogOpen(true);
    };

    const handleSaveClient = async (clientData: Omit<Client, "id" | "user_id" | "created_at" | "updated_at">) => {
        if (editingClient) {
            await updateClient(editingClient.id, clientData);
        } else {
            await createClient(clientData);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            await deleteClient(id);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">
            <Header />
            <main className="flex-grow container mx-auto px-4 pt-24 pb-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black font-headline text-white mb-2 tracking-tight">Client Management</h1>
                        <p className="text-slate-400 font-medium">Manage your leads, active clients, and their custom itineraries.</p>
                    </div>

                    <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 px-6 py-6 rounded-xl shadow-lg shadow-primary/20 transform hover:scale-105 transition-all">
                        <Plus className="w-5 h-5 text-white" />
                        Add Client
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-4 flex-1 shadow-inner">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                                type="text"
                                placeholder="Search clients by name, email, or tags..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 bg-white/5 border-white/5 h-12 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:w-72">
                        <Select value={selectedTag} onValueChange={setSelectedTag}>
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
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl mb-10 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        {error}
                    </div>
                )}

                {filteredClients.length === 0 && !clientsLoading ? (
                    <Card className="glass-main border-white/10 text-center py-24 rounded-3xl">
                        <CardContent>
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <User className="w-12 h-12 text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">No clients found</h3>
                            <p className="text-slate-400 max-w-sm mx-auto mb-10">
                                {searchTerm ? "No clients match your search criteria. Try a different keyword." : "You haven't added any clients yet. Start building your premium client database."}
                            </p>
                            {!searchTerm && (
                                <Button onClick={handleOpenCreate} variant="outline" className="gap-2 border-white/10 hover:bg-white/5 px-8 py-6 rounded-xl transition-all">
                                    <Plus className="w-5 h-5 text-primary" /> Add Your First Client
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredClients.map(client => (
                            <Card
                                key={client.id}
                                className="glass-main border-white/10 overflow-hidden hover:border-primary/40 transition-all duration-300 group cursor-pointer relative rounded-3xl shadow-lg hover:shadow-primary/5"
                                onClick={() => router.push(`/clients/${client.id}`)}
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
                                                <DropdownMenuItem onClick={() => handleOpenEdit(client)} className="cursor-pointer hover:bg-white/5 px-3 py-2.5 rounded-lg transition-colors flex items-center">
                                                    <Edit className="w-4 h-4 mr-3 text-slate-400" /> Edit Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(client.id, client.name)} className="cursor-pointer text-red-400 hover:bg-red-400/10 hover:text-red-300 px-3 py-2.5 rounded-lg transition-colors flex items-center mt-1">
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
                        ))}
                    </div>
                )}

                <ClientDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    client={editingClient}
                    onSave={handleSaveClient}
                />
            </main>
            <Footer />
        </div>
    );
}
