'use client';

import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, DollarSign, Trash2, Eye, Plus, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ItineraryTimeline from '@/components/itinerary-timeline';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';

interface SavedItinerary {
  id: string;
  title: string;
  description: string | null;
  starting_location: string;
  ending_location: string | null;
  start_date: string;
  end_date: string;
  budget: number | null;
  itinerary_data: TravelItineraryOutput;
  created_at: string;
  updated_at: string;
}

export default function MyTripsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();
  const [trips, setTrips] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<SavedItinerary | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user]);

  const fetchTrips = async () => {
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

  const handleDownloadPdf = async () => {
    const pdfElement = pdfTemplateRef.current;
    if (!pdfElement || !selectedTrip) return;

    toast({
      title: "Generating PDF...",
      description: "Your professional itinerary is being created.",
    });

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      pdfElement.style.display = "block";

      const options = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `${selectedTrip.title}.pdf`,
        image: { type: "jpeg", quality: 0.98 } as { type: "jpeg" | "png" | "webp", quality: number },
        html2canvas: { scale: 5, backgroundColor: "#ffffff", logging: false },
        jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" as const },
      };

      await html2pdf().set(options).from(pdfElement).save();
      pdfElement.style.display = "none";

      toast({
        title: "Success!",
        description: "Your itinerary PDF has been downloaded.",
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      pdfElement.style.display = "none";
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "Sorry, we couldn't download your itinerary. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

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
        ) : trips.length === 0 ? (
          <Card className="glass-main border-white/10 text-center p-12">
            <CardContent>
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
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="glass-main border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden group">
                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-2">{trip.title}</CardTitle>
                  <CardDescription className="line-clamp-1">{trip.description}</CardDescription>
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
                        setSelectedTrip(trip);
                        setShowModal(true);
                      }}
                      className="glass-button border-white/20 flex-1 gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTrip(trip.id)}
                      disabled={deleting === trip.id}
                      className="glass-button border-white/20 text-red-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
            <Button 
              onClick={handleDownloadPdf} 
              disabled={isDownloading}
              className="w-fit mt-4"
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download PDF"}
            </Button>
          </DialogHeader>
          {selectedTrip && (
            <div className="mt-4">
              <ItineraryTimeline itinerary={selectedTrip.itinerary_data?.itinerary || []} showDecorations={false} />
            </div>
          )}

          {/* Hidden PDF Template */}
          <div ref={pdfTemplateRef} style={{ display: "none" }}>
            <PdfTemplate itinerary={selectedTrip?.itinerary_data} title={selectedTrip?.title} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PdfTemplateProps {
  itinerary: TravelItineraryOutput | null | undefined;
  title?: string;
}

const PdfTemplate = ({ itinerary, title }: PdfTemplateProps) => {
  if (!itinerary) return null;

  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      padding: "20px",
      backgroundColor: "#fff",
      color: "#333"
    }}>
      {/* Header */}
      <div style={{ borderBottom: "3px solid #0066cc", paddingBottom: "15px", marginBottom: "20px" }}>
        <h1 style={{ color: "#0066cc", fontSize: "28px", margin: "0 0 5px 0" }}>
          {title || "Your Travel Itinerary"}
        </h1>
        <p style={{ color: "#666", fontSize: "12px", margin: "0" }}>
          Generated on {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Overview */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "#0066cc", fontSize: "16px", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>
          Trip Overview
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "10px" }}>
          <div>
            <p style={{ margin: "5px 0", fontSize: "12px" }}>
              <strong>Duration:</strong> {itinerary.itinerary.length} days
            </p>
            <p style={{ margin: "5px 0", fontSize: "12px" }}>
              <strong>Total Walking Distance:</strong> {itinerary.itinerary[0]?.dailyStats?.walkingDistance || "N/A"} km
            </p>
          </div>
          <div>
            <p style={{ margin: "5px 0", fontSize: "12px" }}>
              <strong>Estimated Budget:</strong> ₹{itinerary.itinerary[0]?.dailyStats?.totalCost || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Itineraries */}
      {itinerary.itinerary.map((day, index) => (
        <div key={index} style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
          <h3 style={{
            color: "#fff",
            backgroundColor: "#0066cc",
            padding: "10px",
            margin: "0 0 10px 0",
            fontSize: "14px"
          }}>
            Day {index + 1}: {day.date} - {day.areaFocus}
          </h3>

          {day.timeline.map((step, stepIndex) => (
            <div key={stepIndex} style={{ marginBottom: "10px", paddingLeft: "10px", borderLeft: "3px solid #0066cc" }}>
              <p style={{ margin: "0 0 3px 0", fontWeight: "bold", fontSize: "12px", color: "#0066cc" }}>
                {step.time}
              </p>
              <p style={{ margin: "0", fontSize: "12px", color: "#333", lineHeight: "1.4" }}>
                {step.details}
              </p>
            </div>
          ))}

          <div style={{
            backgroundColor: "#f5f5f5",
            padding: "10px",
            marginTop: "10px",
            fontSize: "11px",
            borderRadius: "4px"
          }}>
            <p style={{ margin: "0", color: "#666" }}>
              <strong>Daily Stats:</strong> Walk {day.dailyStats?.walkingDistance || "N/A"} km | Budget ₹{day.dailyStats?.totalCost || "N/A"}
            </p>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{
        marginTop: "30px",
        paddingTop: "15px",
        borderTop: "2px solid #eee",
        fontSize: "10px",
        color: "#999",
        textAlign: "center"
      }}>
        <p style={{ margin: "0" }}>OdysseyLuxe - Your Personal AI Travel Architect</p>
        <p style={{ margin: "5px 0 0 0" }}>www.odysseyluxe.com</p>
      </div>
    </div>
  );
};
