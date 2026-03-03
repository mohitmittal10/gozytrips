"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useClients } from "@/lib/hooks/use-clients";
import { useClientItineraries, type ClientItinerary } from "@/lib/hooks/use-client-itineraries";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle, Phone, Mail, FileText, MapPin, Calendar, DollarSign, Eye, Edit2 } from "lucide-react";
import { ClientItineraryEditor } from "@/components/client-itinerary-editor";

export default function ClientDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
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
            <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
                <Header />
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
                <Header />
                <div className="container mx-auto px-4 py-32 text-center">
                    <h2 className="text-2xl font-bold mb-4">Client Not Found</h2>
                    <Button variant="outline" onClick={() => router.push('/clients')}>Return to Clients</Button>
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
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
            <Header />
            <main className="flex-grow container mx-auto px-4 pt-24 pb-20">

                {/* Navigation & Header */}
                <div className="mb-8">
                    <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-white hover:bg-transparent" onClick={() => router.push('/clients')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clients
                    </Button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/20 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-primary">{client.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold font-headline text-white mb-2">{client.name}</h1>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {client.tags && client.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 text-sm text-gray-300 w-full md:w-auto">
                            {client.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                    <a href={`mailto:${client.email}`} className="hover:text-primary transition-colors truncate">{client.email}</a>
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                    <a href={`tel:${client.phone}`} className="hover:text-primary transition-colors">{client.phone}</a>
                                </div>
                            )}
                            {client.notes && (
                                <div className="flex items-start gap-2 max-w-sm mt-2 pt-2 border-t border-white/5">
                                    <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-gray-400 italic line-clamp-3">{client.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Itinerary Section */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            Attached Proposals <Badge variant="outline" className="ml-2 font-normal text-gray-400">{itineraries.length}</Badge>
                        </h2>
                    </div>

                    {itineraries.length === 0 ? (
                        <Card className="glass-main border-white/10 text-center p-12">
                            <CardContent>
                                <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold mb-2 text-white">No Itineraries Found</h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    This client does not have any attached quotes or itineraries yet. Create one in the AI Architect and link it to them.
                                </p>
                                <Button onClick={() => router.push('/ai-architect')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    Build New Itinerary
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {itineraries.map((trip) => (
                                <Card key={trip.id} className="glass-main border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden group">
                                    <CardHeader className="pb-3 relative">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <CardTitle className="line-clamp-2 text-lg">{trip.title}</CardTitle>
                                                <CardDescription className="line-clamp-1 text-xs mt-1">{trip.description}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {trip.status && (
                                                <Badge variant="secondary" className="text-xs capitalize shadow-none bg-white/10 text-white">
                                                    {trip.status}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pb-4">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-foreground/80">
                                                <MapPin className="w-4 h-4 text-purple-400" />
                                                <span>{trip.starting_location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-foreground/80">
                                                <Calendar className="w-4 h-4 text-blue-400" />
                                                <span>
                                                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                                                </span>
                                            </div>
                                            {trip.budget && (
                                                <div className="flex items-center gap-2 text-foreground/80">
                                                    <DollarSign className="w-4 h-4 text-green-400" />
                                                    <span>₹{trip.budget} per day</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedItinerary(trip);
                                                    setIsEditorOpen(true);
                                                }}
                                                className="glass-button border-white/20 flex-1 gap-2 hover:bg-primary hover:border-primary hover:text-white transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Review / Edit
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />

            <ClientItineraryEditor
                isOpen={isEditorOpen}
                onOpenChange={setIsEditorOpen}
                trip={selectedItinerary}
                onSave={async (id, data, status) => {
                    await updateItineraryData(id, data, status);
                    setIsEditorOpen(false);
                }}
                clientName={client?.name}
            />
        </div >
    );
}
