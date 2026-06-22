// Multi-step wizard UI wrapping the input form
import React from 'react';
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { theLabSteps } from "@/constants/the-lab";
import type { TheLabFormValues } from "@/types/the-lab";
import { useAuth } from "@/contexts/auth-context";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";

const LabelClass = "text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1.5 block";

interface TheLabFormProps {
  form: UseFormReturn<TheLabFormValues>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onNext: () => void;
  onSubmit: (values: TheLabFormValues) => void;
  isGenerating: boolean;
  sidebarMode?: boolean;
}

const StepDestinations = React.memo(({ form }: { form: UseFormReturn<TheLabFormValues> }) => (
  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
    <FormField control={form.control} name="startingLocation" render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className={LabelClass}>Starting Location</FormLabel>
        <FormControl>
          <Input placeholder="e.g., New Delhi, India" autoFocus {...field} value={field.value || ''} className="h-10 sm:h-11 text-sm border-white/10 focus:border-primary/50 bg-white/5 backdrop-blur rounded-xl" />
        </FormControl>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
    <FormField control={form.control} name="destinations" render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className={LabelClass}>Destinations to Visit</FormLabel>
        <FormControl>
          <Input placeholder="e.g., Paris, Rome, Florence" {...field} value={field.value || ''} className="h-10 sm:h-11 text-sm border-white/10 focus:border-primary/50 bg-white/5 backdrop-blur rounded-xl" />
        </FormControl>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
    <FormField control={form.control} name="endingLocation" render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className={LabelClass}>Ending Location (Optional)</FormLabel>
        <FormControl>
          <Input placeholder="Return location" {...field} value={field.value || ''} className="h-10 sm:h-11 text-sm border-white/10 focus:border-primary/50 bg-white/5 backdrop-blur rounded-xl" />
        </FormControl>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
  </div>
));
StepDestinations.displayName = 'StepDestinations';

const StepDaywisePlan = React.memo(({ form }: { form: UseFormReturn<TheLabFormValues> }) => {
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const daywiseDestinations = form.watch("daywiseDestinations") || "";

  const dayCount = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const [localDays, setLocalDays] = React.useState<string[]>([]);

  // Sync inputs from standard format Day X: Content
  React.useEffect(() => {
    if (dayCount > 0) {
      const parsed = Array(dayCount).fill("");
      const lines = daywiseDestinations.split("\n");
      lines.forEach((line) => {
        const match = line.match(/^Day\s*(\d+)\s*[:\-]\s*(.*)$/i);
        if (match) {
          const dayNum = parseInt(match[1], 10);
          if (dayNum >= 1 && dayNum <= dayCount) {
            parsed[dayNum - 1] = match[2].trim();
          }
        }
      });
      setLocalDays(parsed);
    }
  }, [dayCount, daywiseDestinations]);

  const handleDayChange = (index: number, val: string) => {
    const updated = [...localDays];
    updated[index] = val;
    setLocalDays(updated);

    const combined = updated
      .map((content, idx) => `Day ${idx + 1}: ${content.trim()}`)
      .filter((_, idx) => updated[idx].trim().length > 0)
      .join("\n");
    
    form.setValue("daywiseDestinations", combined, { shouldDirty: true, shouldValidate: true });
  };

  if (dayCount === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 animate-in fade-in duration-500">
        <p className="text-sm font-medium">Please select a valid Start and End Date first to generate your day-wise form template.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div>
          <span className={LabelClass}>Day-by-Day Focus</span>
          <p className="text-[10px] text-zinc-500 mt-0.5">Specify focus or activities. AI will construct detailed schedules around these.</p>
        </div>
        <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">{dayCount} Days</span>
      </div>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {Array.from({ length: dayCount }).map((_, index) => {
          const dayDate = new Date(new Date(startDate).getTime() + index * 24 * 60 * 60 * 1000);
          const formattedDate = format(dayDate, "eee, MMM dd");

          return (
            <div key={index} className="flex gap-4 items-center p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-primary/30 transition-all duration-200">
              <div className="min-w-[80px]">
                <span className="text-[10px] font-bold text-zinc-400 block">DAY {index + 1}</span>
                <span className="text-[9px] text-zinc-500 font-medium block mt-0.5">{formattedDate}</span>
              </div>
              <div className="flex-1">
                <Input
                  placeholder={`e.g., Delhi arrival, sightseeing at Red Fort`}
                  value={localDays[index] || ""}
                  onChange={(e) => handleDayChange(index, e.target.value)}
                  className="h-9 text-xs border-white/5 focus:border-primary/50 bg-white/5 backdrop-blur rounded-lg"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
StepDaywisePlan.displayName = 'StepDaywisePlan';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(s);
          }}
          className="p-0.5 transition-colors"
        >
          <Star
            className={cn(
              "w-3 h-3 transition-colors",
              s <= value ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}

const StepStayOptions = React.memo(({ form }: { form: UseFormReturn<TheLabFormValues> }) => {
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "hotels",
  });

  const dayCount = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const staySlotsCount = Math.max(0, dayCount - 1);

  React.useEffect(() => {
    if (staySlotsCount > 0 && fields.length !== staySlotsCount) {
      if (fields.length < staySlotsCount) {
        const toAdd = [];
        for (let i = fields.length; i < staySlotsCount; i++) {
          toAdd.push({
            id: `h-wiz-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            dayIndex: i,
            name: "",
            address: "",
            starRating: 3,
            nights: 1,
            checkIn: "2:00 PM",
            checkOut: "11:00 AM",
            bookingRef: "",
          });
        }
        append(toAdd);
      } else if (fields.length > staySlotsCount) {
        for (let i = fields.length - 1; i >= staySlotsCount; i--) {
          remove(i);
        }
      }
    }
  }, [staySlotsCount, fields.length, append, remove]);

  if (dayCount <= 1) {
    return (
      <div className="text-center py-8 text-zinc-500 animate-in fade-in duration-500">
        <p className="text-sm font-medium">Please select a valid Start and End Date (at least 2 days) first to configure stay options.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div>
          <span className={LabelClass}>Stay & Accommodation Options</span>
          <p className="text-[10px] text-zinc-500 mt-0.5">Specify stay options for each night. These sync with the Logistics tab.</p>
        </div>
        <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">{staySlotsCount} Nights</span>
      </div>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {fields.map((field, index) => {
          const dayDate = new Date(new Date(startDate).getTime() + index * 24 * 60 * 60 * 1000);
          const formattedDate = format(dayDate, "eee, MMM dd");
          const hotelRating = form.watch(`hotels.${index}.starRating`) || 3;

          return (
            <div key={field.id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-primary/30 transition-all duration-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-400">NIGHT {index + 1} ({formattedDate})</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-zinc-500 mr-1">Rating:</span>
                  <StarRating 
                    value={hotelRating} 
                    onChange={(v) => form.setValue(`hotels.${index}.starRating`, v, { shouldDirty: true, shouldValidate: true })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Hotel / Stay Name</label>
                  <Input
                    placeholder="e.g., Marriott, Cozy Homestay"
                    {...form.register(`hotels.${index}.name` as const)}
                    className="h-8.5 text-xs border-white/5 bg-white/5 backdrop-blur rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">City / Place</label>
                  <Input
                    placeholder="e.g., Delhi, Paris"
                    {...form.register(`hotels.${index}.address` as const)}
                    className="h-8.5 text-xs border-white/5 bg-white/5 backdrop-blur rounded-lg"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
StepStayOptions.displayName = 'StepStayOptions';

const StepDates = React.memo(({ form, sidebarMode }: { form: UseFormReturn<TheLabFormValues>, sidebarMode?: boolean }) => (
  <div className={cn("grid gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700", sidebarMode ? "grid-cols-1" : "grid-cols-2")}>
    <FormField control={form.control} name="startDate" render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className={LabelClass}>Start Date</FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal px-3 py-2 h-10 sm:h-11 text-sm border-white/10 bg-white/5 backdrop-blur rounded-xl", !field.value && "text-muted-foreground/50")}>
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/40" />
                {field.value ? <span className="font-medium">{format(field.value, "MMM dd, yyyy")}</span> : <span>Select date</span>}
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border border-white/10 bg-zinc-900 shadow-2xl rounded-xl" align="start">
            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
          </PopoverContent>
        </Popover>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
    <FormField control={form.control} name="endDate" render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className={LabelClass}>End Date</FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal px-3 py-2 h-10 sm:h-11 text-sm border-white/10 bg-white/5 backdrop-blur rounded-xl", !field.value && "text-muted-foreground/50")}>
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/40" />
                {field.value ? <span className="font-medium">{format(field.value, "MMM dd, yyyy")}</span> : <span>Select date</span>}
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border border-white/10 bg-zinc-900 shadow-2xl rounded-xl" align="start">
            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => { const startDate = form.getValues("startDate"); return date < (startDate || new Date()); }} initialFocus />
          </PopoverContent>
        </Popover>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
  </div>
));
StepDates.displayName = 'StepDates';

const StepPreferences = React.memo(({ form, sidebarMode }: { form: UseFormReturn<TheLabFormValues>, sidebarMode?: boolean }) => {
  const { agencySettings } = useAuth();
  const currencySymbol = getCurrencySymbol((agencySettings as any)?.default_currency || DEFAULT_CURRENCY);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="tripType" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className={LabelClass}>Trip Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-11 text-sm border-white/10 bg-white/5 backdrop-blur rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="adventurous">Adventurous</SelectItem>
                <SelectItem value="scenic">Scenic</SelectItem>
                <SelectItem value="relaxed">Relaxed</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="romantic">Romantic</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="foodie">Foodie</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <FormField control={form.control} name="travelTimePreference" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className={LabelClass}>Timing Preference</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-11 text-sm border-white/10 bg-white/5 backdrop-blur rounded-xl">
                  <SelectValue placeholder="Preference" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="no_preference">No preference</SelectItem>
                <SelectItem value="avoid_night_travel">Avoid night</SelectItem>
                <SelectItem value="prefer_morning_travel">Morning</SelectItem>
                <SelectItem value="prefer_afternoon_travel">Afternoon</SelectItem>
                <SelectItem value="prefer_night_travel">Night</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
      </div>

      <div className="space-y-1">
        <FormLabel className={LabelClass}>Travel Options</FormLabel>
        <FormField control={form.control} name="travelMethods" render={({ field }) => {
          const methods = ["Flight", "Train", "Bus", "Cab", "Ferry"];
          return (
            <div className="flex flex-wrap gap-2">
              {methods.map((method) => {
                const isSelected = field.value?.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      const current = field.value || [];
                      const next = isSelected
                        ? current.filter((m) => m !== method)
                        : [...current, method];
                      field.onChange(next);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-200",
                      isSelected 
                        ? "bg-primary/20 border-primary/50 text-primary" 
                        : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                    )}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          );
        }} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="mustInclude" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className={LabelClass}>Must-Include</FormLabel>
            <FormControl>
              <Textarea placeholder="e.g., Eiffel Tower" {...field} value={field.value || ''} className="min-h-[80px] border-white/10 bg-white/5 backdrop-blur rounded-xl p-3 resize-none text-xs" />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        <FormField control={form.control} name="avoid" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className={LabelClass}>Things to Avoid</FormLabel>
            <FormControl>
              <Textarea placeholder="e.g., Long queues" {...field} value={field.value || ''} className="min-h-[80px] border-white/10 bg-white/5 backdrop-blur rounded-xl p-3 resize-none text-xs" />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="leisureTime" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur px-3 py-2">
            <FormLabel className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 m-0">Leisure Time</FormLabel>
            <FormControl><Switch className="scale-75 origin-right" checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
        <FormField control={form.control} name="leisureDay" render={({ field }) => (
          <FormItem className={cn("space-y-1 transition-opacity duration-300", !form.watch("leisureTime") && "opacity-30 pointer-events-none")}>
            <FormControl>
              <Input type="number" placeholder="Day Preference" {...field} value={field.value || ''} className="h-9 text-[11px] border-white/10 bg-white/5 backdrop-blur rounded-xl" />
            </FormControl>
          </FormItem>
        )} />
      </div>
    </div>
  );
});
StepPreferences.displayName = 'StepPreferences';


const TheLabForm = React.memo(function TheLabForm({
  form, currentStep, setCurrentStep, onNext, onSubmit, isGenerating, sidebarMode
}: TheLabFormProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          if (currentStep < theLabSteps.length - 1) {
            e.preventDefault();
            onNext();
          } else {
            form.handleSubmit(onSubmit)(e);
          }
        }}
        className="space-y-8"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // Prevent default Enter key behavior and call onNext if not on last step
            if (currentStep < theLabSteps.length - 1) {
              const target = e.target as HTMLElement;
              // Don't interfere with textareas or buttons that might have their own behavior
              if (target.tagName !== "TEXTAREA" && target.getAttribute("role") !== "button" && target.tagName !== "BUTTON") {
                e.preventDefault();
                onNext();
              }
            }
          }
        }}
      >
        {!sidebarMode && (
          <>
            {/* Progress Bar & Indicators */}
            <div className="mb-4 flex items-center justify-center gap-2 sm:gap-3">
              {theLabSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { if (index < currentStep) setCurrentStep(index); }}
                    disabled={index > currentStep}
                    className={cn(
                      "group relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-700 ease-out disabled:cursor-not-allowed",
                      index < currentStep && "bg-foreground/10 text-foreground/60",
                      index === currentStep && "bg-foreground text-background shadow-lg",
                      index > currentStep && "bg-muted/50 text-muted-foreground/40",
                    )}
                  >
                    {index < currentStep ? <Check className="h-3 w-3 animate-in zoom-in duration-500" strokeWidth={2.5} /> : <span className="text-[10px] font-bold tabular-nums">{step.id}</span>}
                  </button>
                  {index < theLabSteps.length - 1 && (
                    <div className="relative h-[1px] w-4 sm:w-8 md:w-10">
                      <div className="absolute inset-0 bg-white/10" />
                      <div className="absolute inset-0 bg-foreground/30 transition-all duration-700 ease-out origin-left" style={{ transform: `scaleX(${index < currentStep ? 1 : 0})` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mb-4 overflow-hidden rounded-full bg-white/5 h-[1px]">
              <div className="h-full bg-foreground/60 transition-all duration-1000 ease-out" style={{ width: `${((currentStep + 1) / theLabSteps.length) * 100}%` }} />
            </div>
          </>
        )}

        {currentStep === 0 && <StepDestinations form={form} />}
        {currentStep === 1 && <StepDates form={form} sidebarMode={sidebarMode} />}
        {currentStep === 2 && <StepDaywisePlan form={form} />}
        {currentStep === 3 && <StepPreferences form={form} sidebarMode={sidebarMode} />}
        {currentStep === 4 && <StepStayOptions form={form} />}


        {/* Actions */}
        <div className="space-y-3 pt-2">
          {currentStep < theLabSteps.length - 1 ? (
            <Button key="btn-continue" type="button" onClick={(e) => { e.preventDefault(); onNext(); }} className="w-full h-10 group transition-all duration-300 hover:shadow-lg bg-primary text-white rounded-xl">
              <span className="flex items-center justify-center gap-2 text-sm font-bold">Continue <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 duration-300" strokeWidth={2} /></span>
            </Button>
          ) : (
            <Button key="btn-generate" type="submit" disabled={isGenerating} className="w-full h-10 hover:shadow-lg bg-primary text-white rounded-xl">
              <span className="flex items-center justify-center gap-2 text-sm font-bold">{isGenerating ? "Crafting Your Journey..." : "Generate Optimized Trip"} {!isGenerating && <Check className="h-4 w-4 ml-1" strokeWidth={2} />}</span>
            </Button>
          )}
          {currentStep > 0 && <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="w-full text-center text-[11px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-400">Go back</button>}
        </div>
      </form>
    </Form>
  );
});

export default TheLabForm;


