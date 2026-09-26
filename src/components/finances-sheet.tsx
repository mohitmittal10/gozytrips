'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTripFinances } from '@/lib/hooks/use-trip-finances';
import { SavedItinerary } from './trip-card';
import { Trash2, ExternalLink, Plus } from 'lucide-react';
import UniqueLoading from './ui/morph-loading';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from '@/types/pricing';

const DEFAULT_EXPENSE_CATEGORIES = [
  { value: 'hotel', label: 'Accommodation' },
  { value: 'flight', label: 'Flight' },
  { value: 'activity', label: 'Activity' },
  { value: 'transport', label: 'Transport' },
  { value: 'fee', label: 'Fee/Other' },
];

interface FinancesSheetProps {
  trip: SavedItinerary | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinancesSheet({ trip, isOpen, onOpenChange }: FinancesSheetProps) {
  const { lineItems, loading, error, metrics, addLineItem, deleteLineItem } = useTripFinances(trip?.id);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('hotel');
  const [newNetCost, setNewNetCost] = useState('');
  const { agencySettings } = useAuth();
  const [newMarkup, setNewMarkup] = useState((agencySettings as any)?.default_markup_value?.toString() || '10');
  const { toast } = useToast();
  const supabase = React.useMemo(() => createClient(), []);
  const [referenceOptions, setReferenceOptions] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await supabase
        .from('reference_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (data) setReferenceOptions(data);
    };
    fetchOptions();
  }, [supabase]);

  const categories = React.useMemo(() => {
    const opts = referenceOptions.filter(opt => opt.scope === 'expense_category');
    return opts.length > 0 ? opts.map(opt => ({ value: opt.value, label: opt.label })) : DEFAULT_EXPENSE_CATEGORIES;
  }, [referenceOptions]);

  const tripCurrency = trip?.currency || (agencySettings as any)?.default_currency || DEFAULT_CURRENCY;
  const currencySymbol = getCurrencySymbol(tripCurrency as any);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newNetCost) return;
    
    setIsAdding(true);
    try {
      await addLineItem({
        title: newTitle,
        category: newCategory,
        net_cost: Number(newNetCost),
        markup_percentage: Number(newMarkup),
        currency: tripCurrency,
      });
      setNewTitle('');
      setNewNetCost('');
      setNewMarkup('10');
      toast({ title: 'Success', description: 'Line item added.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const copyInvoiceLink = () => {
    if (!trip) return;
    const url = `${window.location.origin}/invoice/${trip.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link Copied', description: 'Invoice link copied to clipboard.' });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border-l border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl sm:rounded-l-2xl">
        <SheetHeader>
          <SheetTitle className="text-slate-900 dark:text-white font-bold">Trip Finances</SheetTitle>
          <SheetDescription className="text-slate-600 dark:text-zinc-400 text-xs">
            Manage quoting and invoicing for {trip?.title}
          </SheetDescription>
        </SheetHeader>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-md mt-4 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl flex flex-col items-center justify-center">
            <span className="text-xs text-slate-600 dark:text-zinc-400 font-semibold uppercase tracking-wider">Total Net</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">{currencySymbol}{metrics.totalNet.toFixed(2)}</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col items-center justify-center">
            <span className="text-xs text-emerald-700 dark:text-green-400 font-semibold uppercase tracking-wider">Est. Profit</span>
            <span className="text-xl font-bold text-emerald-700 dark:text-green-400">{currencySymbol}{metrics.totalMarkupAmount.toFixed(2)}</span>
          </div>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl flex flex-col items-center justify-center">
            <span className="text-xs text-slate-600 dark:text-zinc-400 font-semibold uppercase tracking-wider">Client Gross</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">{currencySymbol}{metrics.totalGross.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Line Items</h3>
            <Button variant="outline" size="sm" onClick={copyInvoiceLink} className="h-8 text-xs border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 gap-2 cursor-pointer font-semibold rounded-xl">
              <ExternalLink className="w-3.5 h-3.5" />
              Client Link
            </Button>
          </div>

          <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-100/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200 dark:border-white/10">
                  <TableHead className="text-slate-700 dark:text-zinc-300 font-semibold">Item</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-zinc-300 font-semibold">Net Cost</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-zinc-300 font-semibold">Markup %</TableHead>
                  <TableHead className="text-right text-slate-700 dark:text-zinc-300 font-semibold">Gross</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-600 dark:text-zinc-400">
                      <UniqueLoading variant="morph" size="sm" className="mx-auto mb-3" />
                      <p className="text-xs uppercase tracking-widest opacity-70 font-bold">Syncing Ledger</p>
                    </TableCell>
                  </TableRow>
                ) : lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-600 dark:text-zinc-400">
                      No line items added yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  lineItems.map((item) => {
                    const gross = Number(item.net_cost) * (1 + Number(item.markup_percentage) / 100);
                    return (
                      <TableRow key={item.id} className="border-slate-200 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/[0.03]">
                        <TableCell className="font-semibold text-slate-900 dark:text-white">{item.title} <span className="block text-xs text-slate-500 dark:text-zinc-400 capitalize font-normal">{item.category}</span></TableCell>
                        <TableCell className="text-right text-slate-800 dark:text-zinc-200 font-medium">{currencySymbol}{Number(item.net_cost).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-slate-800 dark:text-zinc-200 font-medium">{item.markup_percentage}%</TableCell>
                        <TableCell className="text-right font-bold text-slate-900 dark:text-white">{currencySymbol}{gross.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 dark:text-red-400 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                            onClick={() => deleteLineItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <form onSubmit={handleAdd} className="mt-6 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl space-y-4">
            <h4 className="font-bold text-sm flex items-center gap-2 text-slate-900 dark:text-white"><Plus className="w-4 h-4 text-primary" /> Add Item</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">Description</Label>
                <Input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Marriott 3 Nights" className="bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-9 text-xs rounded-xl" />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-xl">
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-xs">{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">Net Cost ({currencySymbol})</Label>
                <Input required type="number" min="0" step="0.01" value={newNetCost} onChange={(e) => setNewNetCost(e.target.value)} placeholder="0.00" className="bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-9 text-xs rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">Markup (%)</Label>
                <Input required type="number" min="0" step="0.1" value={newMarkup} onChange={(e) => setNewMarkup(e.target.value)} placeholder="10" className="bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white h-9 text-xs rounded-xl" />
              </div>
            </div>
            <Button type="submit" disabled={isAdding} className="w-full aurora-gradient text-slate-900 dark:text-white font-bold text-xs h-9 rounded-xl border-none shadow-md hover:brightness-110 cursor-pointer mt-2">
              {isAdding ? <UniqueLoading variant="morph" size="sm" className="w-4 h-4 mr-2" /> : null}
              Add Line Item
            </Button>
          </form>

        </div>
      </SheetContent>
    </Sheet>
  );
}

