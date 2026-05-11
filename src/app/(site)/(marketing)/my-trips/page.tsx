'use client';

import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { MapPin, Calendar, DollarSign, Trash2, Eye, Plus, ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ItineraryTimeline from '@/components/itinerary-timeline';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import { type PdfTheme } from '@/components/pdf-template';
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
import { TripCard } from '@/components/trip-card';
import { FinancesSheet } from '@/components/finances-sheet';
import { getCurrencySymbol } from "@/lib/utils/currency";
import { useReferenceOptions } from '@/hooks/use-reference-options';

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
  const { userPreferences } = useAuth();
  const { options: themeOptions } = useReferenceOptions("pdf_theme");

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
          show_timestamps: (trip as any).show_timestamps ?? true,
          show_prices: (trip as any).show_prices ?? true
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
    <div className="flex flex-col min-h-screen bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showFavouritesOnly ? trips.filter(t => t.is_favourite) : trips).map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip as any}
                clients={clients}
                agencySettings={agencySettings}
                onToggleFavourite={handleToggleFavourite}
                onDuplicate={handleDuplicateTrip}
                onView={(trip) => {
                  setSelectedTrip(trip as any);
                  setShowModal(true);
                }}
                onFinances={(trip) => {
                  setSelectedTrip(trip as any);
                  setShowFinances(true);
                }}
                onDelete={handleDeleteTrip}
                deletingId={deleting}
              />
            ))}
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
                  {themeOptions.length > 0 ? (
                    themeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="classic">Classic (Default)</SelectItem>
                      <SelectItem value="editorial">Editorial (Magazine)</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                    </>
                  )}
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
              />
            </div>
          )}

          {/* PDF Preview & Export */}
          <PdfPreviewEditor
            isOpen={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            templateProps={{
              itinerary: selectedTrip?.itinerary_data,
              title: selectedTrip?.title,
              userProfile: userProfile,
              agencySettings: agencySettings,
              hotels: (selectedTrip?.itinerary_data as any)?.hotels || [],
              flights: (selectedTrip?.itinerary_data as any)?.flights || [],
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

