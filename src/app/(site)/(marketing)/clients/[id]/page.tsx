"use client";

import { use, useEffect, useState } from "react";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useClients } from "@/lib/hooks/use-clients";
import { useClientItineraries, type ClientItinerary } from "@/lib/hooks/use-client-itineraries";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle, Phone, Mail, FileIcon, MapPin, Calendar, DollarSign, Edit, Plus } from "lucide-react";
import { ClientItineraryEditor } from "@/components/client-itinerary-editor";
import { cn, getAvatarColor } from "@/lib/utils";

export default function ClientDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const { user, agencySettings, loading: authLoading } = useAuth();
    const { clients } = useClients();
    const { itineraries, loading: itinsLoading, fetchClientItineraries, updateItineraryData } = useClientItineraries(params.id);

    // Modal state
    const [selectedItinerary, setSelectedItinerary] = useState<ClientItinerary | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // Find specific client
    const client = clients.find(c => c.id === params.id);

    useEffect(() => {
        if (!authLoading && user) {
            fetchClientItineraries();
        }
    }, [user, authLoading, params.id, fetchClientItineraries]);

    if (authLoading || itinsLoading || (!client && clients.length === 0)) {
        return (
            <div className="flex flex-col min-h-screen bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex flex-col min-h-screen bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">
                <div className="container mx-auto px-4 py-32 text-center">
                    <h2 className="text-2xl font-bold mb-4 text-white">Client Not Found</h2>
                    <Button variant="outline" onClick={() => router.push('/clients')} className="border-white/20 text-white hover:bg-white/10">Return to Clients</Button>
                </div>
            </div>
        );
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-transparent">
            <main className="flex-grow container mx-auto px-4 pt-24 pb-20">

                {/* Navigation & Header */}
                <div className="mb-12">
                    <Button variant="ghost" className="mb-6 pl-0 text-slate-400 hover:text-white hover:bg-transparent transition-colors group" onClick={() => router.push('/clients')}>
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Clients
                    </Button>

                    <div className="relative bg-white/[0.02] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <UserCircle className="w-64 h-64 text-primary -rotate-12 translate-x-16 -translate-y-16" />
                        </div>

                        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className={cn("w-24 h-24 rounded-2xl flex flex-col items-center justify-center shadow-lg border border-white/10", getAvatarColor(client.name))}>
                                    <span className="text-4xl font-black text-white">{client.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black font-headline text-white mb-3 tracking-tight">{client.name}</h1>
                                    <div className="flex flex-wrap gap-2">
                                        {client.tags && client.tags.length > 0 ? client.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border border-primary/20 font-bold px-3 py-1 text-xs uppercase tracking-wider">
                                                {tag}
                                            </Badge>
                                        )) : (
                                            <span className="text-sm text-slate-500 font-medium italic">No tags assigned</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 text-sm font-medium text-slate-300 w-full lg:w-auto bg-white/5 p-5 rounded-2xl border border-white/5 shadow-inner">
                                {client.email && (
                                    <div className="flex items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                            <Mail className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                        </div>
                                        <a href={`mailto:${client.email}`} className="hover:text-primary transition-colors truncate">{client.email}</a>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                            <Phone className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                        </div>
                                        <a href={`tel:${client.phone}`} className="hover:text-primary transition-colors">{client.phone}</a>
                                    </div>
                                )}
                                {client.notes && (
                                    <div className="flex items-start gap-3 mt-2 pt-3 border-t border-white/10">
                                        <FileIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-400 italic line-clamp-3 leading-relaxed">{client.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Itinerary Section */}
                <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                        <h2 className="text-3xl font-black font-headline text-white flex items-center gap-3 tracking-tight">
                            Attached Proposals 
                            <Badge variant="outline" className="ml-2 font-bold text-primary border-primary/30 bg-primary/10 px-3 py-1 text-sm">{itineraries.length}</Badge>
                        </h2>
                        {itineraries.length > 0 && (
                            <Button onClick={() => router.push('/the-lab')} className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 shadow-lg shadow-primary/20 transition-all">
                                <Plus className="w-4 h-4" /> New Proposal
                            </Button>
                        )}
                    </div>

                    {itineraries.length === 0 ? (
                        <Card className="glass-main border-white/10 text-center py-24 rounded-3xl shadow-2xl">
                            <CardContent>
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MapPin className="w-12 h-12 text-slate-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">No Proposals Found</h3>
                                <p className="text-slate-400 max-w-md mx-auto mb-10">
                                    This client does not have any attached quotes or itineraries yet. Create one in The Lab and link it to them.
                                </p>
                                <Button onClick={() => router.push('/the-lab')} className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-primary/20 transition-all">
                                    Build New Itinerary
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/[0.01]">
                                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proposal Details</th>
                                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</th>
                                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Travel Dates</th>
                                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget</th>
                                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {itineraries.map((trip) => (
                                            <tr 
                                                key={trip.id} 
                                                className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                                                onClick={() => {
                                                    setSelectedItinerary(trip);
                                                    setIsEditorOpen(true);
                                                }}
                                            >
                                                <td className="p-5">
                                                    <div>
                                                        <p className="font-bold text-white text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">{trip.title}</p>
                                                        <p className="text-xs text-slate-500 font-medium line-clamp-1">{trip.description || 'No description provided'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                                                        <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                                                        <span className="truncate max-w-[150px]">{trip.starting_location || 'TBD'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-sm text-slate-400 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                                                        <span className="whitespace-nowrap">
                                                            {trip.start_date ? formatDate(trip.start_date) : 'TBD'}
                                                            {trip.end_date && trip.start_date !== trip.end_date ? ` - ${formatDate(trip.end_date)}` : ''}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    {trip.status ? (
                                                        <Badge variant="secondary" className="bg-white/10 text-white border-white/20 font-bold px-3 py-1 text-[10px] uppercase tracking-wider">
                                                            {trip.status}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-slate-600 font-medium italic">Draft</span>
                                                    )}
                                                </td>
                                                <td className="p-5">
                                                    {trip.budget ? (
                                                        <div className="text-sm font-bold text-emerald-400">
                                                            <span>{getCurrencySymbol(agencySettings?.default_currency || DEFAULT_CURRENCY)}{trip.budget.toLocaleString()}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-600 font-medium italic">Not set</span>
                                                    )}
                                                </td>
                                                <td className="p-5 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all transform group-hover:translate-x-0 translate-x-2 opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <ClientItineraryEditor
                isOpen={isEditorOpen}
                onOpenChange={setIsEditorOpen}
                trip={selectedItinerary}
                onSave={async (id, updates) => {
                    await updateItineraryData(id, updates);
                    setIsEditorOpen(false);
                }}
                clientName={client?.name}
            />
        </div>
    );
}
