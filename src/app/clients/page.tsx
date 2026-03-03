"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useClients, type Client } from "@/lib/hooks/use-clients";
import { ClientDialog } from "@/components/client-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, User, PhoneCall, Mail, File, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ClientsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { clients, loading, error, createClient, updateClient, deleteClient } = useClients();
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
                <p className="text-gray-400">Please sign in to manage your clients.</p>
            </div>
        );
    }

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-white mb-2">Client Management</h1>
                    <p className="text-gray-400">Manage your leads, active clients, and their custom itineraries.</p>
                </div>

                <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    <Plus className="w-5 h-5" />
                    Add Client
                </Button>
            </div>

            <div className="bg-black/20 border border-white/10 rounded-xl p-4 mb-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                        type="text"
                        placeholder="Search clients by name, email, or tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8">
                    {error}
                </div>
            )}

            {loading && clients.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : filteredClients.length === 0 ? (
                <Card className="glass-card text-center py-16">
                    <CardContent>
                        <User className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No clients found</h3>
                        <p className="text-gray-400 max-w-sm mx-auto mb-6">
                            {searchTerm ? "No clients match your search criteria." : "You haven't added any clients yet. Start building your CRM database."}
                        </p>
                        {!searchTerm && (
                            <Button onClick={handleOpenCreate} variant="outline" className="gap-2">
                                <Plus className="w-4 h-4" /> Add Your First Client
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map(client => (
                        <Card
                            key={client.id}
                            className="glass-card overflow-hidden hover:border-primary/50 transition-colors group cursor-pointer"
                            onClick={() => router.push(`/clients/${client.id}`)}
                        >
                            <CardHeader className="pb-4 relative">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-white group-hover:text-primary transition-colors">{client.name}</CardTitle>
                                            <CardDescription className="text-xs">Added {new Date(client.created_at).toLocaleDateString()}</CardDescription>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 relative z-10">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </div>
                                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-gray-200">
                                            <DropdownMenuLabel>Client Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-gray-800" />
                                            <DropdownMenuItem onClick={() => handleOpenEdit(client)} className="cursor-pointer hover:bg-gray-800">
                                                <Edit className="w-4 h-4 mr-2" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(client.id, client.name)} className="cursor-pointer text-red-400 hover:bg-red-400/10 hover:text-red-300">
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete Client
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 text-sm text-gray-300">
                                    {client.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-500" />
                                            <a href={`mailto:${client.email}`} className="hover:text-primary transition-colors truncate">{client.email}</a>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2">
                                            <PhoneCall className="w-4 h-4 text-gray-500" />
                                            <a href={`tel:${client.phone}`} className="hover:text-primary transition-colors">{client.phone}</a>
                                        </div>
                                    )}
                                    {client.notes && (
                                        <div className="flex items-start gap-2 pt-2 border-t border-white/5 mt-2">
                                            <File className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                                            <p className="line-clamp-2 text-xs text-gray-400">{client.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {client.tags && client.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {client.tags.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 text-[10px] px-2 py-0">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
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
        </div>
    );
}
