"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useClients, type Client } from "@/lib/hooks/use-clients";
import { ClientDialog } from "@/components/client-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, User } from "lucide-react";
import { AuthRequired } from "@/components/auth/auth-required";
import { ClientSearch } from "@/components/clients/client-search";
import { ClientFilter } from "@/components/clients/client-filter";
import { ClientCard } from "@/components/clients/client-card";

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
            <div className="flex flex-col min-h-screen bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">
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
        <div className="flex flex-col min-h-screen bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">

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
                            <ClientCard
                                key={client.id}
                                client={client}
                                onClick={() => router.push(`/clients/${client.id}`)}
                                onEdit={handleOpenEdit}
                                onDelete={handleDelete}
                            />
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

        </div>
    );
}
