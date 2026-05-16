"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useClients, type Client } from "@/lib/hooks/use-clients";
import { ClientDialog } from "@/components/client-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, User, ArrowRight, Clock, Edit, Trash2 } from "lucide-react";
import { AuthRequired } from "@/components/auth/auth-required";
import { ClientSearch } from "@/components/clients/client-search";
import { ClientFilter } from "@/components/clients/client-filter";
import { Badge } from "@/components/ui/badge";
import { cn, getAvatarColor } from "@/lib/utils";

export default function ClientsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { clients, loading: clientsLoading, error, createClient, updateClient, deleteClient } = useClients();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState<string>("all");

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const uniqueTags = useMemo(() => {
        return Array.from(new Set(clients.flatMap(c => c.tags || []))).sort();
    }, [clients]);

    const filteredClients = useMemo(() => {
        return clients.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesTag = selectedTag === "all" || (c.tags && c.tags.includes(selectedTag));

            return matchesSearch && matchesTag;
        });
    }, [clients, searchTerm, selectedTag]);

    if (authLoading || (clientsLoading && clients.length === 0)) {
        return (
            <div className="flex flex-col min-h-screen bg-transparent">
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <AuthRequired />;
    }

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
        <div className="flex flex-col min-h-screen bg-transparent">

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
                    <ClientSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                    <ClientFilter uniqueTags={uniqueTags} selectedTag={selectedTag} onTagChange={setSelectedTag} />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl mb-10 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        {error}
                    </div>
                )}

                {filteredClients.length === 0 && !clientsLoading ? (
                    <Card className="glass-main border-white/10 text-center py-24 rounded-3xl shadow-2xl">
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
                    <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden mt-6 shadow-2xl backdrop-blur-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/[0.01]">
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Info</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tags</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Updated</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredClients.map((client) => (
                                        <tr 
                                            key={client.id} 
                                            className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                                            onClick={() => router.push(`/clients/${client.id}`)}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("inline-flex w-10 h-10 rounded-full items-center justify-center text-sm font-bold text-white bg-gradient-to-br shrink-0 shadow-lg border border-white/10", getAvatarColor(client.name))}>
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white group-hover:text-primary transition-colors">{client.name}</p>
                                                        <p className="text-xs text-slate-500 font-medium">{client.email || 'No email provided'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {client.tags && client.tags.length > 0 ? (
                                                        client.tags.map((tag: string, idx: number) => (
                                                            <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary border border-primary/20 font-bold px-2.5 py-0.5 text-[10px] uppercase tracking-wider">
                                                                {tag}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-slate-600 font-medium italic">No tags</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-500 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                                                    {new Date(client.updated_at || client.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenEdit(client);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(client.id, client.name);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary transition-colors ml-3" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <ClientDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    client={editingClient}
                    onSave={handleSaveClient}
                />
            </main>

        </div>
    );
}

