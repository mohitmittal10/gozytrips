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
import { Trash2, ExternalLink, Plus, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [newMarkup, setNewMarkup] = useState('10');
  const { toast } = useToast();

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
        currency: 'INR',
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
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto glass-main border-white/10 sm:rounded-l-2xl">
        <SheetHeader>
          <SheetTitle>Trip Finances</SheetTitle>
          <SheetDescription>
            Manage quoting and invoicing for {trip?.title}
          </SheetDescription>
        </SheetHeader>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md mt-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground">Total Net</span>
            <span className="text-xl font-bold">₹{metrics.totalNet.toFixed(2)}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center">
            <span className="text-sm text-green-400">Est. Profit</span>
            <span className="text-xl font-bold text-green-400">₹{metrics.totalMarkupAmount.toFixed(2)}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground">Client Gross</span>
            <span className="text-xl font-bold">₹{metrics.totalGross.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Line Items</h3>
            <Button variant="outline" size="sm" onClick={copyInvoiceLink} className="glass-button gap-2">
              <ExternalLink className="w-4 h-4" />
              Client Link
            </Button>
          </div>

          <div className="border border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Net Cost</TableHead>
                  <TableHead className="text-right">Markup %</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading finances...
                    </TableCell>
                  </TableRow>
                ) : lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No line items added yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  lineItems.map((item) => {
                    const gross = Number(item.net_cost) * (1 + Number(item.markup_percentage) / 100);
                    return (
                      <TableRow key={item.id} className="border-white/5">
                        <TableCell className="font-medium">{item.title} <span className="block text-xs text-muted-foreground capitalize">{item.category}</span></TableCell>
                        <TableCell className="text-right">₹{Number(item.net_cost).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.markup_percentage}%</TableCell>
                        <TableCell className="text-right font-semibold">₹{gross.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
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

          <form onSubmit={handleAdd} className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label>Description</Label>
                <Input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Marriott 3 Nights" className="bg-background/50" />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Accommodation</SelectItem>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="fee">Fee/Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Net Cost (₹)</Label>
                <Input required type="number" min="0" step="0.01" value={newNetCost} onChange={(e) => setNewNetCost(e.target.value)} placeholder="0.00" className="bg-background/50" />
              </div>
              <div className="space-y-1">
                <Label>Markup (%)</Label>
                <Input required type="number" min="0" step="0.1" value={newMarkup} onChange={(e) => setNewMarkup(e.target.value)} placeholder="10" className="bg-background/50" />
              </div>
            </div>
            <Button type="submit" disabled={isAdding} className="w-full glass-button bg-primary/20 hover:bg-primary/30 text-primary mt-2">
              {isAdding ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Line Item
            </Button>
          </form>

        </div>
      </SheetContent>
    </Sheet>
  );
}
