'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { BookingServiceType } from '@/types/standalone-bookings';
import { useClients } from '@/lib/hooks/use-clients';

interface StandaloneBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
}

export function StandaloneBookingDialog({ isOpen, onClose, onBookingCreated }: StandaloneBookingDialogProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();
  const { clients } = useClients();

  const [loading, setLoading] = useState(false);
  const [serviceType, setServiceType] = useState<BookingServiceType>('flight');
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState<string>('none');
  const [netCost, setNetCost] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState('');
  
  // Specific fields
  const [provider, setProvider] = useState('');
  const [pnr, setPnr] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);

      const bookingDetails = {
        provider,
        pnr_or_confirmation: pnr,
        passengers: parseInt(passengers) || 1,
        notes
      };

      const payload = {
        user_id: user.id,
        client_id: clientId === 'none' ? null : clientId,
        title,
        service_type: serviceType,
        status: 'draft',
        booking_details: bookingDetails,
        net_cost: parseFloat(netCost) || 0,
        markup_percentage: parseFloat(markupPercentage) || 0,
        currency: 'USD'
      };

      const { error } = await supabase
        .from('standalone_bookings')
        .insert(payload);

      if (error) throw error;

      toast({ title: 'Success', description: 'Booking created successfully.' });
      onBookingCreated();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create booking',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-main border-white/10">
        <DialogHeader>
          <DialogTitle>Add Standalone Booking</DialogTitle>
          <DialogDescription>
            Book a specific service like a Cab, Bus, Train, or Flight independent of a full itinerary.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={serviceType} onValueChange={(val) => setServiceType(val as BookingServiceType)}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="cab">Cab / Transfer</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="train">Train</SelectItem>
                  <SelectItem value="hotel">Hotel (Room Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Flight to NYC"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/5 border-white/10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Assign to Client (Optional)</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Client --</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Passengers</Label>
              <Input
                type="number"
                min="1"
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Provider / Operator</Label>
              <Input
                placeholder="e.g. Delta Airlines"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>PNR / Confirmation #</Label>
              <Input
                placeholder="e.g. XY123AB"
                value={pnr}
                onChange={(e) => setPnr(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Net Cost (Buy Price)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={netCost}
                onChange={(e) => setNetCost(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Markup (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="10"
                value={markupPercentage}
                onChange={(e) => setMarkupPercentage(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any specific requests, baggages limits, pickup instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/5 border-white/10 min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="glass-button">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              {loading ? 'Creating...' : 'Create Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
