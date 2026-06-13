'use client';

import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { MapPin, Calendar, DollarSign, Trash2, Eye, Plus, ArrowLeft, Heart, Clock, Copy, ArrowRight, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ItineraryTimeline from '@/components/itinerary-timeline';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import { type PdfTheme } from '@/components/pdf-template';
import { getMergedPdfThemeOptions } from '@/components/pdf/theme-config';
import { PdfPreviewEditor } from '@/components/pdf-preview-editor';
import { useRouter } from 'next/navigation';
import { useClients } from '@/lib/hooks/use-clients';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FinancesSheet } from '@/components/finances-sheet';
import { getCurrencySymbol } from "@/lib/utils/currency";
import { useReferenceOptions } from '@/hooks/use-reference-options';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DEFAULT_CURRENCY } from "@/types/pricing";

interface SavedItinerary {
  id: string;
  title: string;
  description: string | null;
  starting_location: string;
  ending_location: string | null;
  start_date: string;
  end_date: string;
  budget: number | null;
  client_id: string | null;
  status: string;
  is_favourite: boolean | null;
  itinerary_data: TravelItineraryOutput;
  currency: string | null;
  show_timestamps?: boolean;
  created_at: string;
  updated_at: string;
}

export default function MyTripsPage() {
  const { user, userProfile, agencySettings, loading: authLoading } = useAuth();
  const currencySymbol = getCurrencySymbol((agencySettings as any)?.default_currency || DEFAULT_CURRENCY);
  const supabase = createClient();
  const { toast } = useToast();
  const [trips, setTrips] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<SavedItinerary | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFinances, setShowFinances] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<PdfTheme>('classic');
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  const router = useRouter();
  const { clients } = useClients();
  const selectedClientForTrip = useMemo(() => {
    if (!selectedTrip || !selectedTrip.client_id) return null;
    return clients.find(c => c.id === selectedTrip.client_id) || null;
  }, [selectedTrip, clients]);
  const { userPreferences } = useAuth();
  const { options: themeOptions } = useReferenceOptions("pdf_theme");
  const pdfThemeOptions = getMergedPdfThemeOptions(themeOptions);

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) return;

    if (user) {
      fetchTrips();
    } else {
      // Auth finished but no user — stop the loading spinner
      setLoading(false);
    }
  }, [user, authLoading]);

  // Sync with user preferences
  useEffect(() => {
    if (userPreferences) {
      if (userPreferences.default_pdf_theme) {
        setSelectedTheme(userPreferences.default_pdf_theme as PdfTheme);
      }
      if (userPreferences.my_trips_preferences?.showFavouritesOnly !== undefined) {
        setShowFavouritesOnly(!!userPreferences.my_trips_preferences.showFavouritesOnly);
      }
    }
  }, [userPreferences]);

  const { updatePreferences } = useAuth();

  const fetchTrips = async (retryCount = 0) => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setTrips(data as SavedItinerary[]);
    } catch (error) {
      // Retry on lock contention errors (can happen during initial auth setup)
      if (retryCount < 2 && error instanceof Error && error.name === 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchTrips(retryCount + 1);
      }
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch trips',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setTrips(trips.filter(t => t.id !== id));
      toast({
        title: 'Success',
        description: 'Trip deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete trip',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleFavourite = async (trip: SavedItinerary) => {
    try {
      const newStatus = !trip.is_favourite;

      setTrips(trips.map(t =>
        t.id === trip.id ? { ...t, is_favourite: newStatus } : t
      ));

      const { error } = await supabase
        .from('itineraries')
        .update({ is_favourite: newStatus })
        .eq('id', trip.id)
        .eq('user_id', user?.id);

      if (error) {
        setTrips(trips.map(t =>
          t.id === trip.id ? { ...t, is_favourite: trip.is_favourite } : t
        ));
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
    } catch (error) {
      setTrips(trips.map(t =>
        t.id === trip.id ? { ...t, is_favourite: trip.is_favourite } : t
      ));
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update favourite status',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateTrip = async (trip: SavedItinerary) => {
    try {
      setLoading(true);
      
      const { data: newTrip, error } = await supabase
        .from('itineraries')
        .insert([{
          user_id: user?.id,
          title: `Copy of ${trip.title}`,
          itinerary_data: trip.itinerary_data,
          status: 'draft',
          client_id: null,
          trip_id: `DRF-${Date.now()}`,
          draft_source_itinerary_id: trip.id,
          // Copy metadata/preferences if they exist
          generation_preferences: (trip as any).generation_preferences || {},
          selected_theme: (trip as any).selected_theme || 'classic',
          show_timestamps: (trip as any).show_timestamps ?? true
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Opening a copy in the The Lab...',
      });

      router.push(`/the-lab?itineraryId=${newTrip.id}`);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to duplicate trip',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedTrip) return;
    setIsPreviewOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">

      <main className="flex-grow container mx-auto px-4 py-20">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Trips</h1>
              <p className="text-muted-foreground">Your saved travel itineraries</p>
            </div>
            <Link href="/the-lab">
              <Button className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 gap-2">
                <Plus className="w-4 h-4" />
                New Trip
              </Button>
            </Link>
          </div>

          <div className="flex mb-6 space-x-3">
            <Button
              variant="outline"
              onClick={async () => {
                setShowFavouritesOnly(false);
                await updatePreferences({
                  my_trips_preferences: {
                    ...(userPreferences?.my_trips_preferences as any || {}),
                    showFavouritesOnly: false
                  }
                });
              }}
              className={`glass-button rounded-full px-6 ${!showFavouritesOnly ? 'bg-primary/20 hover:bg-primary/30 text-primary border-primary/50' : 'border-white/10 hover:bg-white/5'}`}
            >
              All Trips
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                setShowFavouritesOnly(true);
                await updatePreferences({
                  my_trips_preferences: {
                    ...(userPreferences?.my_trips_preferences as any || {}),
                    showFavouritesOnly: true
                  }
                });
              }}
              className={`glass-button rounded-full px-6 gap-2 ${showFavouritesOnly ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-500 border-pink-500/50' : 'border-white/10 hover:bg-white/5'}`}
            >
              <Heart className="w-4 h-4" fill={showFavouritesOnly ? "currentColor" : "none"} />
              Favourites
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-main border-white/10 animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-3 bg-white/10 rounded"></div>
                  <div className="h-3 bg-white/10 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (showFavouritesOnly ? trips.filter(t => t.is_favourite) : trips).length === 0 ? (
          <Card className="glass-main border-white/10 text-center p-12">
            <CardContent>
              {showFavouritesOnly ? (
                <>
                  <Heart className="w-12 h-12 mx-auto text-pink-500/50 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No favourite trips</h2>
                  <p className="text-muted-foreground mb-6">
                    You haven't added any trips to your favourites yet.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowFavouritesOnly(false)}
                    className="glass-button"
                  >
                    View All Trips
                  </Button>
                </>
              ) : (
                <>
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No trips yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Start creating your first luxurious travel itinerary with The Lab
                  </p>
                  <Link href="/the-lab">
                    <Button className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                      Create Your First Trip
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden mt-6 shadow-2xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.01]">
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trip Info</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Travel Dates</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(showFavouritesOnly ? trips.filter(t => t.is_favourite) : trips).map((trip) => {
                    const client = clients.find(c => c.id === trip.client_id);
                    return (
                      <tr 
                        key={trip.id} 
                        className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedTrip(trip);
                          setShowModal(true);
                        }}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="inline-flex w-10 h-10 rounded-xl items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-purple-500/20 to-pink-500/20 shrink-0 shadow-lg border border-white/10">
                              <MapPin className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="max-w-[200px]">
                              <p className="font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{trip.title}</p>
                              <p className="text-xs text-slate-500 font-medium line-clamp-1">{trip.description || trip.starting_location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {client ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold px-2.5 py-0.5 text-[10px] uppercase tracking-wider">
                              {client.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-600 font-medium italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                            <span className="text-xs">₹</span>
                            {trip.budget?.toLocaleString() || '0'}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className={cn(
                            "font-bold px-2.5 py-0.5 text-[10px] uppercase tracking-wider",
                            trip.status === 'draft' ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          )}>
                            {trip.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavourite(trip);
                              }}
                            >
                              <Heart className="w-4 h-4" fill={trip.is_favourite ? "currentColor" : "none"} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateTrip(trip);
                              }}
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrip(trip);
                                setShowFinances(true);
                              }}
                              title="Finances"
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTrip(trip.id);
                              }}
                              disabled={deleting === trip.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary transition-colors ml-3" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>


      {/* Modal for viewing itinerary */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-main border-white/10">
          <DialogHeader>
            <DialogTitle>{selectedTrip?.title}</DialogTitle>
            <DialogDescription>{selectedTrip?.description}</DialogDescription>
            <div className="flex items-center gap-4 mt-4">
              <Select 
                value={selectedTheme} 
                onValueChange={async (value) => {
                  const newTheme = value as PdfTheme;
                  setSelectedTheme(newTheme);
                  // Update global preference
                  await updatePreferences({ default_pdf_theme: newTheme });
                  // Update individual trip theme
                  if (selectedTrip) {
                    await supabase
                      .from('itineraries')
                      .update({ selected_theme: newTheme })
                      .eq('id', selectedTrip.id);
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select PDF Format" />
                </SelectTrigger>
                <SelectContent>
                  {pdfThemeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleDownloadPdf}
                disabled={!selectedTrip}
                className="w-fit"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview & Export
              </Button>
            </div>
          </DialogHeader>
          {selectedTrip && (
            <div className="mt-4">
              <ItineraryTimeline
                itinerary={selectedTrip.itinerary_data?.itinerary || []}
                showDecorations={false}
                hotels={(selectedTrip.itinerary_data as any)?.hotels || []}
                flights={(selectedTrip.itinerary_data as any)?.flights || []}
                currency={(selectedTrip.itinerary_data as any)?.pricing?.currency}
                destinations={(selectedTrip as any)?.destinations}
              />
            </div>
          )}

          <PdfPreviewEditor
            isOpen={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            templateProps={{
              clientName: selectedClientForTrip?.name || "",
              itinerary: selectedTrip?.itinerary_data,
              title: selectedTrip?.title,
              userProfile: userProfile,
              agencySettings: agencySettings,
              hotels: (selectedTrip?.itinerary_data as any)?.hotels || [],
              flights: (selectedTrip?.itinerary_data as any)?.flights || [],
              showTimestamps: selectedTrip?.show_timestamps ?? true,
            }}
            initialTheme={selectedTheme}
            itineraryId={selectedTrip?.id}
            filename={`${selectedTrip?.title || 'Itinerary'}.pdf`}
          />
        </DialogContent>
      </Dialog>

      <FinancesSheet
        trip={selectedTrip}
        isOpen={showFinances}
        onOpenChange={setShowFinances}
      />
    </div>
  );
}

