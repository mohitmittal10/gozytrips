'use client';

import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Plane, Car, Bus, Train, Hotel, Plus, Trash2 } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { StandaloneBookingDialog } from '@/components/standalone-bookings/booking-dialog';
import type { BookingServiceType } from '@/types/standalone-bookings';

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('standalone_bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from('standalone_bookings')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      setBookings(bookings.filter(b => b.id !== id));
      toast({ title: 'Success', description: 'Booking deleted successfully.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete booking',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const getServiceIcon = (type: BookingServiceType) => {
    switch (type) {
      case 'flight': return <Plane className="w-6 h-6 text-blue-500" />;
      case 'cab': return <Car className="w-6 h-6 text-yellow-500" />;
      case 'bus': return <Bus className="w-6 h-6 text-green-500" />;
      case 'train': return <Train className="w-6 h-6 text-orange-500" />;
      case 'hotel': return <Hotel className="w-6 h-6 text-purple-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#05070a] bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,92,51,0.08),transparent_50%)]">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-20">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Standalone Bookings</h1>
              <p className="text-muted-foreground">Manage individual flights, cabs, buses, trains, and hotels.</p>
            </div>
            <Button
              onClick={() => setShowDialog(true)}
              className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 gap-2"
            >
              <Plus className="w-4 h-4" />
              New Booking
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-main border-white/10 animate-pulse h-32"></Card>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card className="glass-main border-white/10 text-center p-12">
            <CardContent>
              <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
              <p className="text-muted-foreground mb-6">
                Need to just book a cab or a flight for your client? Create a standalone booking here.
              </p>
              <Button onClick={() => setShowDialog(true)} className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                Create New Booking
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="glass-main border-white/10 hover:bg-white/5 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    {getServiceIcon(booking.service_type)}
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">{booking.title}</h3>
                      <p className="text-xs text-muted-foreground uppercase">{booking.service_type} &bull; {booking.status}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(booking.id)}
                    disabled={deleting === booking.id}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mt-2">
                    Net Cost: {booking.currency} {booking.net_cost}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
      
      {showDialog && (
        <StandaloneBookingDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          onBookingCreated={fetchBookings}
        />
      )}
    </div>
  );
}
