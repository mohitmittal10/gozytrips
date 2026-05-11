'use client';

import { useState, useEffect } from 'react';
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
import { useReferenceOptions } from '@/hooks/use-reference-options';
import { useFormDraft } from '@/hooks/use-form-draft';
import { DEFAULT_CURRENCY } from '@/types/pricing';

interface StandaloneBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
}

export function StandaloneBookingDialog({ isOpen, onClose, onBookingCreated }: StandaloneBookingDialogProps) {
  const { user, agencySettings } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();
  const { clients } = useClients();

  const { options } = useReferenceOptions();
  const serviceTypes = options.filter(opt => opt.scope === 'booking_service_type');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: 'flight' as BookingServiceType,
    title: '',
    clientId: 'none',
    netCost: '',
    markupPercentage: String(agencySettings?.default_markup_value || ''),
    provider: '',
    pnr: '',
    passengers: '1',
    notes: '',
    currency: (agencySettings as any)?.default_booking_currency || (agencySettings as any)?.default_currency || DEFAULT_CURRENCY
  });

  const { saveDraft, clearDraft } = useFormDraft(
    isOpen ? "booking:new" : null,
    {
      serviceType: 'flight' as BookingServiceType,
      title: '',
      clientId: 'none',
      netCost: '',
      markupPercentage: String(agencySettings?.default_markup_value || ''),
      provider: '',
      pnr: '',
      passengers: '1',
      notes: '',
      currency: (agencySettings as any)?.default_booking_currency || (agencySettings as any)?.default_currency || DEFAULT_CURRENCY
    },
    (draftData) => {
      setFormData(prev => ({ ...prev, ...draftData }));
    }
  );

  // Update markup if agency settings change
  useEffect(() => {
    if (agencySettings?.default_markup_value && !formData.markupPercentage) {
      setFormData(prev => ({ ...prev, markupPercentage: String(agencySettings.default_markup_value) }));
    }
  }, [agencySettings]);

  // Save draft whenever formData changes
  useEffect(() => {
    if (isOpen) {
      saveDraft(formData);
    }
  }, [formData, isOpen, saveDraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);

      const bookingDetails = {
        provider: formData.provider,
        pnr_or_confirmation: formData.pnr,
        passengers: parseInt(formData.passengers) || 1,
        notes: formData.notes
      };

      const payload = {
        user_id: user.id,
        client_id: formData.clientId === 'none' ? null : formData.clientId,
        title: formData.title,
        service_type: formData.serviceType,
        status: 'draft',
        booking_details: bookingDetails,
        net_cost: parseFloat(formData.netCost) || 0,
        markup_percentage: parseFloat(formData.markupPercentage) || 0,
        currency: formData.currency
      };

      const { error } = await supabase
        .from('standalone_bookings')
        .insert(payload);

      if (error) throw error;

      await clearDraft();
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
              <Select value={formData.serviceType} onValueChange={(val) => setFormData({ ...formData, serviceType: val as BookingServiceType })}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.length > 0 ? (
                    serviceTypes.map(st => (
                      <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="flight">Flight</SelectItem>
                      <SelectItem value="cab">Cab / Transfer</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="train">Train</SelectItem>
                      <SelectItem value="hotel">Hotel (Room Only)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Flight to NYC"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-white/5 border-white/10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Assign to Client (Optional)</Label>
              <Select value={formData.clientId} onValueChange={(val) => setFormData({ ...formData, clientId: val })}>
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
                value={formData.passengers}
                onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Provider / Operator</Label>
              <Input
                placeholder="e.g. Delta Airlines"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>PNR / Confirmation #</Label>
              <Input
                placeholder="e.g. XY123AB"
                value={formData.pnr}
                onChange={(e) => setFormData({ ...formData, pnr: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Net Cost (Buy Price)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.netCost}
                onChange={(e) => setFormData({ ...formData, netCost: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Markup (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="10"
                value={formData.markupPercentage}
                onChange={(e) => setFormData({ ...formData, markupPercentage: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={(val) => setFormData({ ...formData, currency: val })}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.filter(o => o.scope === 'currency').map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any specific requests, baggages limits, pickup instructions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

