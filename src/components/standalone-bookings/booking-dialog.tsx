'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useClients } from '@/lib/hooks/use-clients';
import { useReferenceOptions } from '@/hooks/use-reference-options';
import { useFormDraft } from '@/hooks/use-form-draft';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_CURRENCY } from '@/types/pricing';
import type { BookingServiceType } from '@/types/standalone-bookings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  standaloneBookingFormSchema,
  type StandaloneBookingFormValues,
} from '@/lib/security/form-validation';
import { cn } from '@/lib/utils';

interface StandaloneBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
}

function buildDefaultValues(agencySettings: unknown): StandaloneBookingFormValues {
  const settings = agencySettings as Record<string, unknown> | null;

  return {
    serviceType: 'flight',
    title: '',
    clientId: 'none',
    netCost: '',
    markupPercentage: String(settings?.default_markup_value ?? ''),
    provider: '',
    pnr: '',
    passengers: '1',
    notes: '',
    currency:
      String(
        settings?.default_booking_currency ??
          settings?.default_currency ??
          DEFAULT_CURRENCY
      ).toUpperCase(),
  };
}

export function StandaloneBookingDialog({
  isOpen,
  onClose,
  onBookingCreated,
}: StandaloneBookingDialogProps) {
  const { user, agencySettings } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();
  const { clients } = useClients();
  const { options } = useReferenceOptions();
  const [loading, setLoading] = useState(false);
  const [hasFailedSubmit, setHasFailedSubmit] = useState(false);

  const serviceTypes = options.filter((option) => option.scope === 'booking_service_type');
  const currencyOptions = options.filter((option) => option.scope === 'currency');
  const defaultValues = useMemo(() => buildDefaultValues(agencySettings), [agencySettings]);

  const form = useForm<StandaloneBookingFormValues>({
    resolver: zodResolver(standaloneBookingFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues,
  });

  const { saveDraft, clearDraft } = useFormDraft(
    isOpen ? 'booking:new' : null,
    defaultValues,
    (draftData) => {
      form.reset({ ...defaultValues, ...draftData });
    }
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setHasFailedSubmit(false);
    form.reset(defaultValues);
  }, [defaultValues, form, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const subscription = form.watch((values) => {
      saveDraft({
        serviceType: values.serviceType ?? defaultValues.serviceType,
        title: values.title ?? '',
        clientId: values.clientId ?? 'none',
        netCost: values.netCost ?? '',
        markupPercentage: values.markupPercentage ?? '',
        provider: values.provider ?? '',
        pnr: values.pnr ?? '',
        passengers: values.passengers ?? '1',
        notes: values.notes ?? '',
        currency: values.currency ?? defaultValues.currency,
      });
    });

    return () => subscription.unsubscribe();
  }, [defaultValues, form, isOpen, saveDraft]);

  const formErrors = Object.values(form.formState.errors)
    .map((issue) => issue?.message)
    .filter((message): message is string => Boolean(message));

  const handleSubmit = async (values: StandaloneBookingFormValues) => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);

      const bookingDetails = {
        provider: values.provider || undefined,
        pnr_or_confirmation: values.pnr || undefined,
        passengers: parseInt(values.passengers, 10) || 1,
        notes: values.notes || undefined,
      };

      const payload = {
        user_id: user.id,
        client_id: values.clientId === 'none' ? null : values.clientId,
        title: values.title,
        service_type: values.serviceType,
        status: 'draft',
        booking_details: bookingDetails,
        net_cost: parseFloat(values.netCost) || 0,
        markup_percentage: parseFloat(values.markupPercentage) || 0,
        currency: values.currency,
      };

      const { error } = await supabase.from('standalone_bookings').insert(payload);

      if (error) {
        throw error;
      }

      await clearDraft();
      setHasFailedSubmit(false);
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
      <DialogContent className="glass-main max-h-[90vh] max-w-2xl overflow-y-auto border-white/10">
        <DialogHeader>
          <DialogTitle>Add Standalone Booking</DialogTitle>
          <DialogDescription>
            Book a specific service like a cab, bus, train, or flight independent of a full itinerary.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, () => setHasFailedSubmit(true))}
            className="space-y-6"
            noValidate
          >
            {form.formState.submitCount > 0 && formErrors.length > 1 && (
              <Alert className="border-amber-500/30 bg-amber-500/10" aria-live="polite">
                <AlertCircle className="h-4 w-4 text-amber-300" />
                <AlertTitle>Please check the highlighted fields</AlertTitle>
                <AlertDescription>
                  {formErrors.map((message, index) => (
                    <p key={`${message}-${index}`}>{message}</p>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Service Type</FormLabel>
                    <Select value={field.value} onValueChange={(value) => field.onChange(value as BookingServiceType)}>
                      <FormControl>
                        <SelectTrigger className="border-white/10 bg-white/5">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypes.length > 0 ? (
                          serviceTypes.map((serviceType) => (
                            <SelectItem key={serviceType.value} value={serviceType.value}>
                              {serviceType.label}
                            </SelectItem>
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
                    <FormMessage className="text-xs" aria-live="polite" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field, fieldState }) => {
                  const showSuccess =
                    fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

                  return (
                    <FormItem className="space-y-2">
                      <FormLabel>Title</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="e.g. Flight to NYC"
                            {...field}
                            className={cn('border-white/10 bg-white/5', showSuccess && 'border-emerald-500/40 pr-10')}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                        )}
                      </div>
                      <FormMessage className="text-xs" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Assign to Client</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="border-white/10 bg-white/5">
                          <SelectValue placeholder="Select client..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Client</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" aria-live="polite" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passengers"
                render={({ field, fieldState }) => {
                  const showSuccess =
                    fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

                  return (
                    <FormItem className="space-y-2">
                      <FormLabel>Passengers</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            {...field}
                            className={cn('border-white/10 bg-white/5', showSuccess && 'border-emerald-500/40 pr-10')}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                        )}
                      </div>
                      <FormMessage className="text-xs" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="provider"
                render={({ field, fieldState }) => {
                  const showSuccess =
                    fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

                  return (
                    <FormItem className="space-y-2">
                      <FormLabel>Provider / Operator</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="e.g. Delta Airlines"
                            {...field}
                            className={cn('border-white/10 bg-white/5', showSuccess && 'border-emerald-500/40 pr-10')}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                        )}
                      </div>
                      <FormMessage className="text-xs" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="pnr"
                render={({ field, fieldState }) => {
                  const showSuccess =
                    fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

                  return (
                    <FormItem className="space-y-2">
                      <FormLabel>PNR / Confirmation #</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="e.g. XY123AB"
                            {...field}
                            className={cn('border-white/10 bg-white/5', showSuccess && 'border-emerald-500/40 pr-10')}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                        )}
                      </div>
                      <FormDescription className="text-xs">
                        This field blocks shell operators, path fragments, and command-style payloads.
                      </FormDescription>
                      <FormMessage className="text-xs" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="netCost"
                render={({ field, fieldState }) => {
                  const showSuccess =
                    fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

                  return (
                    <FormItem className="space-y-2">
                      <FormLabel>Net Cost (Buy Price)</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            className={cn('border-white/10 bg-white/5', showSuccess && 'border-emerald-500/40 pr-10')}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                        )}
                      </div>
                      <FormMessage className="text-xs" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="markupPercentage"
                render={({ field, fieldState }) => {
                  const showSuccess =
                    fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

                  return (
                    <FormItem className="space-y-2">
                      <FormLabel>Markup (%)</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="10"
                            {...field}
                            className={cn('border-white/10 bg-white/5', showSuccess && 'border-emerald-500/40 pr-10')}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                        )}
                      </div>
                      <FormMessage className="text-xs" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Currency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="border-white/10 bg-white/5">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" aria-live="polite" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => {
                const showSuccess =
                  fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

                return (
                  <FormItem className="space-y-2">
                    <FormLabel>Additional Notes</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Textarea
                          placeholder="Any specific requests, baggage limits, or pickup instructions..."
                          {...field}
                          className={cn('min-h-[100px] border-white/10 bg-white/5', showSuccess && 'border-emerald-500/40 pr-10')}
                        />
                      </FormControl>
                      {showSuccess && (
                        <CheckCircle2 className="absolute right-3 top-4 h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                    <FormDescription className="text-xs">
                      Validates on blur and blocks script-like, path traversal, database-style, and prompt-injection input.
                    </FormDescription>
                    <FormMessage className="text-xs" aria-live="polite" />
                  </FormItem>
                );
              }}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="glass-button">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || (hasFailedSubmit && !form.formState.isValid)}
                className="glass-button border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                {loading ? 'Creating...' : 'Create Booking'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
