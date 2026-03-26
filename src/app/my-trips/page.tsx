'use client';

import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { MapPin, Calendar, DollarSign, Trash2, Eye, Plus, ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
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
  created_at: string;
  updated_at: string;
}

export default function MyTripsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
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
      // 1. Set the draft variables in local storage
      const { hotels, flights, pricing, ...coreItinerary } = trip.itinerary_data as any;
      localStorage.setItem('travelItinerary', JSON.stringify(coreItinerary));
      if (hotels) localStorage.setItem('travelHotels', JSON.stringify(hotels));
      if (flights) localStorage.setItem('travelFlights', JSON.stringify(flights));
      if (pricing) localStorage.setItem('travelPricing', JSON.stringify(pricing));

      localStorage.removeItem('draft_client_id'); // Reset CRM fields for the copy
      localStorage.setItem('draft_status', 'draft');

      toast({
        title: 'Duplicating Trip',
        description: 'Opening a copy in the AI Architect...',
      });

      router.push('/ai-architect');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate trip',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedTrip) return;
    setIsPreviewOpen(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-20">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Trips</h1>
              <p className="text-muted-foreground">Your saved travel itineraries</p>
            </div>
            <Link href="/ai-architect">
              <Button className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 gap-2">
                <Plus className="w-4 h-4" />
                New Trip
              </Button>
            </Link>
          </div>

          <div className="flex mb-6 space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowFavouritesOnly(false)}
              className={`glass-button rounded-full px-6 ${!showFavouritesOnly ? 'bg-primary/20 hover:bg-primary/30 text-primary border-primary/50' : 'border-white/10 hover:bg-white/5'}`}
            >
              All Trips
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFavouritesOnly(true)}
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
                    Start creating your first luxurious travel itinerary with AI Architect
                  </p>
                  <Link href="/ai-architect">
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
      <Footer />

      {/* Modal for viewing itinerary */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-main border-white/10">
          <DialogHeader>
            <DialogTitle>{selectedTrip?.title}</DialogTitle>
            <DialogDescription>{selectedTrip?.description}</DialogDescription>
            <div className="flex items-center gap-4 mt-4">
              <Select defaultValue="classic" onValueChange={(value) => setSelectedTheme(value as PdfTheme)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select PDF Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic (Default)</SelectItem>
                  <SelectItem value="editorial">Editorial (Magazine)</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
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
              hotels: (selectedTrip?.itinerary_data as any)?.hotels || [],
              flights: (selectedTrip?.itinerary_data as any)?.flights || [],
            }}
            initialTheme={selectedTheme}
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
