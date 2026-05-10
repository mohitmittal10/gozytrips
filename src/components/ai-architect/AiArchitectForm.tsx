// Multi-step wizard UI wrapping the input form
import React from 'react';
import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ArrowRight } from "lucide-react";
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
import { aiArchitectSteps } from "@/constants/ai-architect";
import type { AiArchitectFormValues } from "@/types/ai-architect";
import { useAuth } from "@/contexts/auth-context";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";

const LabelClass = "text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1.5 block";

interface AiArchitectFormProps {
  form: UseFormReturn<AiArchitectFormValues>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onNext: () => void;
  onSubmit: (values: AiArchitectFormValues) => void;
  isGenerating: boolean;
  sidebarMode?: boolean;
}

const StepDestinations = React.memo(({ form }: { form: UseFormReturn<AiArchitectFormValues> }) => (
  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
    <FormField control={form.control} name="startingLocation" render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className={LabelClass}>Starting Location</FormLabel>
        <FormControl>
          <Input placeholder="e.g., New Delhi, India" autoFocus {...field} className="h-10 sm:h-11 text-sm border-white/10 focus:border-primary/50 bg-white/5 backdrop-blur rounded-xl" />
        </FormControl>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
    <FormField control={form.control} name="destinations" render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className={LabelClass}>Destinations to Visit</FormLabel>
        <FormControl>
          <Input placeholder="e.g., Paris, Rome, Florence" {...field} className="h-10 sm:h-11 text-sm border-white/10 focus:border-primary/50 bg-white/5 backdrop-blur rounded-xl" />
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

const StepDates = React.memo(({ form, sidebarMode }: { form: UseFormReturn<AiArchitectFormValues>, sidebarMode?: boolean }) => (
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

const StepPreferences = React.memo(({ form, sidebarMode }: { form: UseFormReturn<AiArchitectFormValues>, sidebarMode?: boolean }) => {
  const { agencySettings } = useAuth();
  const currencySymbol = getCurrencySymbol((agencySettings as any)?.default_currency || DEFAULT_CURRENCY);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="budget" render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className={LabelClass}>Budget ({currencySymbol})</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Total budget" {...field} value={field.value || ''} className="h-10 sm:h-11 text-sm border-white/10 bg-white/5 backdrop-blur rounded-xl" />
            </FormControl>
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


const AiArchitectForm = React.memo(function AiArchitectForm({
  form, currentStep, setCurrentStep, onNext, onSubmit, isGenerating, sidebarMode
}: AiArchitectFormProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          if (currentStep < aiArchitectSteps.length - 1) {
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
            if (currentStep < aiArchitectSteps.length - 1) {
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
              {aiArchitectSteps.map((step, index) => (
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
                  {index < aiArchitectSteps.length - 1 && (
                    <div className="relative h-[1px] w-4 sm:w-8 md:w-10">
                      <div className="absolute inset-0 bg-white/10" />
                      <div className="absolute inset-0 bg-foreground/30 transition-all duration-700 ease-out origin-left" style={{ transform: `scaleX(${index < currentStep ? 1 : 0})` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mb-4 overflow-hidden rounded-full bg-white/5 h-[1px]">
              <div className="h-full bg-foreground/60 transition-all duration-1000 ease-out" style={{ width: `${((currentStep + 1) / aiArchitectSteps.length) * 100}%` }} />
            </div>
          </>
        )}

        {currentStep === 0 && <StepDestinations form={form} />}
        {currentStep === 1 && <StepDates form={form} sidebarMode={sidebarMode} />}
        {currentStep === 2 && <StepPreferences form={form} sidebarMode={sidebarMode} />}


        {/* Actions */}
        <div className="space-y-3 pt-2">
          {currentStep < aiArchitectSteps.length - 1 ? (
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

export default AiArchitectForm;
