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

interface AiArchitectFormProps {
  form: UseFormReturn<AiArchitectFormValues>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onNext: () => void;
  onSubmit: (values: AiArchitectFormValues) => void;
  isGenerating: boolean;
}

const StepDestinations = React.memo(({ form }: { form: UseFormReturn<AiArchitectFormValues> }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
    <FormField control={form.control} name="startingLocation" render={({ field }) => (
      <FormItem>
        <div className="flex items-baseline justify-between mb-2">
          <FormLabel className="text-lg font-medium tracking-tight">Starting Location</FormLabel>
        </div>
        <div className="relative group">
          <FormControl>
            <Input placeholder="e.g., New Delhi, India" autoFocus {...field} className="h-12 sm:h-14 text-sm sm:text-base border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur" />
          </FormControl>
        </div>
        <FormMessage />
      </FormItem>
    )} />
    <FormField control={form.control} name="destinations" render={({ field }) => (
      <FormItem>
        <div className="flex items-baseline justify-between mb-2">
          <FormLabel className="text-lg font-medium tracking-tight">Destinations to Visit (comma-separated)</FormLabel>
        </div>
        <div className="relative group">
          <FormControl>
            <Input placeholder="e.g., Paris, Rome, Florence" {...field} className="h-12 sm:h-14 text-sm sm:text-base border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur" />
          </FormControl>
        </div>
        <FormMessage />
      </FormItem>
    )} />
    <FormField control={form.control} name="endingLocation" render={({ field }) => (
      <FormItem>
        <div className="flex items-baseline justify-between mb-2">
          <FormLabel className="text-lg font-medium tracking-tight">Ending Location (Optional)</FormLabel>
        </div>
        <div className="relative group">
          <FormControl>
            <Input placeholder="Leave empty to return to starting location" {...field} value={field.value || ''} className="h-12 sm:h-14 text-sm sm:text-base border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur" />
          </FormControl>
        </div>
        <FormMessage />
      </FormItem>
    )} />
  </div>
));
StepDestinations.displayName = 'StepDestinations';

const StepDates = React.memo(({ form }: { form: UseFormReturn<AiArchitectFormValues> }) => (
  <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
    <FormField control={form.control} name="startDate" render={({ field }) => (
      <FormItem>
        <div className="flex items-baseline justify-between mb-2">
          <FormLabel className="text-lg font-medium tracking-tight">Trip Start Date</FormLabel>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal px-4 py-2.5 h-14 text-base border-border/50 bg-background/50 backdrop-blur rounded-lg", !field.value && "text-muted-foreground/70")}>
                <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0 text-foreground/60" />
                {field.value ? <span className="font-medium">{format(field.value, "MMM dd, yyyy")}</span> : <span>Select start date</span>}
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border border-border/50 bg-background/95 backdrop-blur shadow-lg rounded-lg" align="start">
            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    )} />
    <FormField control={form.control} name="endDate" render={({ field }) => (
      <FormItem>
        <div className="flex items-baseline justify-between mb-2">
          <FormLabel className="text-lg font-medium tracking-tight">Trip End Date</FormLabel>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal px-4 py-2.5 h-14 text-base border-border/50 bg-background/50 backdrop-blur rounded-lg", !field.value && "text-muted-foreground/70")}>
                <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0 text-foreground/60" />
                {field.value ? <span className="font-medium">{format(field.value, "MMM dd, yyyy")}</span> : <span>Select end date</span>}
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border border-border/50 bg-background/95 backdrop-blur shadow-lg rounded-lg" align="start">
            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => { const startDate = form.getValues("startDate"); return date < (startDate || new Date()); }} initialFocus />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    )} />
  </div>
));
StepDates.displayName = 'StepDates';

const StepPreferences = React.memo(({ form }: { form: UseFormReturn<AiArchitectFormValues> }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
    <div className="grid md:grid-cols-1 gap-6">
      <FormField control={form.control} name="budget" render={({ field }) => (
        <FormItem>
          <div className="flex items-baseline justify-between mb-2">
            <FormLabel className="text-lg font-medium tracking-tight">Max Daily Budget (INR)</FormLabel>
          </div>
          <FormControl>
            <Input type="number" placeholder="Optional, e.g., 10000" {...field} value={field.value || ''} className="h-12 sm:h-14 text-sm sm:text-base border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <FormField control={form.control} name="mustInclude" render={({ field }) => (
        <FormItem>
          <div className="flex items-baseline justify-between mb-2">
            <FormLabel className="text-lg font-medium tracking-tight">Must-Include Attractions</FormLabel>
          </div>
          <FormControl>
            <Textarea placeholder="Optional, e.g., Eiffel Tower" {...field} value={field.value || ''} className="min-h-[100px] border-border/50 bg-background/50 backdrop-blur rounded-xl p-4 resize-none" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="avoid" render={({ field }) => (
        <FormItem>
          <div className="flex items-baseline justify-between mb-2">
            <FormLabel className="text-lg font-medium tracking-tight">Things to Avoid</FormLabel>
          </div>
          <FormControl>
            <Textarea placeholder="Optional, e.g., Tourist traps" {...field} value={field.value || ''} className="min-h-[100px] border-border/50 bg-background/50 backdrop-blur rounded-xl p-4 resize-none" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <FormField control={form.control} name="leisureTime" render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-background/50 backdrop-blur p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-lg font-medium tracking-tight">Include Leisure Time</FormLabel>
            <div className="text-sm text-muted-foreground/80">Deliberately add unstructured time</div>
          </div>
          <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="leisureDay" render={({ field }) => (
        <FormItem className={cn("transition-opacity duration-300", !form.watch("leisureTime") && "opacity-50 pointer-events-none")}>
          <div className="flex items-baseline justify-between mb-2">
            <FormLabel className="text-lg font-medium tracking-tight">Leisure Day Preference</FormLabel>
          </div>
          <FormControl>
            <Input type="number" placeholder="Optional, e.g., 2" {...field} value={field.value || ''} className="h-12 sm:h-14 border-border/50 bg-background/50 backdrop-blur" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
    <div className="grid md:grid-cols-1 gap-6">
      <FormField control={form.control} name="travelTimePreference" render={({ field }) => (
        <FormItem>
          <div className="flex items-baseline justify-between mb-2">
            <FormLabel className="text-lg font-medium tracking-tight">Travel Timing Preference</FormLabel>
          </div>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="h-12 sm:h-14 border-border/50 bg-background/50 backdrop-blur">
                <SelectValue placeholder="Select a travel preference" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="no_preference">No specific preference</SelectItem>
              <SelectItem value="avoid_night_travel">Avoid night travel</SelectItem>
              <SelectItem value="prefer_morning_travel">Prefer morning travel</SelectItem>
              <SelectItem value="prefer_afternoon_travel">Prefer afternoon travel</SelectItem>
              <SelectItem value="prefer_night_travel">Prefer night travel</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  </div>
));
StepPreferences.displayName = 'StepPreferences';


const AiArchitectForm = React.memo(function AiArchitectForm({
  form, currentStep, setCurrentStep, onNext, onSubmit, isGenerating
}: AiArchitectFormProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target instanceof HTMLInputElement && e.target.type !== "submit" && e.target.type !== "button") {
            e.preventDefault();
            if (currentStep < aiArchitectSteps.length - 1) onNext();
          }
        }}
      >
        {/* Progress Bar & Indicators */}
        <div className="mb-6 sm:mb-10 flex items-center justify-center gap-2 sm:gap-3">
          {aiArchitectSteps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { if (index < currentStep) setCurrentStep(index); }}
                disabled={index > currentStep}
                className={cn(
                  "group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-700 ease-out disabled:cursor-not-allowed",
                  index < currentStep && "bg-foreground/10 text-foreground/60",
                  index === currentStep && "bg-foreground text-background shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)]",
                  index > currentStep && "bg-muted/50 text-muted-foreground/40",
                )}
              >
                {index < currentStep ? <Check className="h-4 w-4 animate-in zoom-in duration-500" strokeWidth={2.5} /> : <span className="text-sm font-medium tabular-nums">{step.id}</span>}
                {index === currentStep && <div className="absolute inset-0 rounded-full bg-foreground/20 blur-md animate-pulse" />}
              </button>
              {index < aiArchitectSteps.length - 1 && (
                <div className="relative h-[1.5px] w-6 sm:w-12 md:w-16">
                  <div className="absolute inset-0 bg-[rgba(207,207,207,0.4)]" />
                  <div className="absolute inset-0 bg-foreground/30 transition-all duration-700 ease-out origin-left" style={{ transform: `scaleX(${index < currentStep ? 1 : 0})` }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mb-8 overflow-hidden rounded-full bg-muted/30 h-[2px]">
          <div className="h-full bg-gradient-to-r from-foreground/60 to-foreground transition-all duration-1000 ease-out" style={{ width: `${((currentStep + 1) / aiArchitectSteps.length) * 100}%` }} />
        </div>

        {currentStep === 0 && <StepDestinations form={form} />}
        {currentStep === 1 && <StepDates form={form} />}
        {currentStep === 2 && <StepPreferences form={form} />}

        {/* Actions */}
        <div className="space-y-4 pt-4">
          {currentStep < aiArchitectSteps.length - 1 ? (
            <Button type="button" onClick={onNext} className="w-full h-11 sm:h-12 group transition-all duration-300 hover:shadow-lg bg-primary text-white rounded-xl">
              <span className="flex items-center justify-center gap-2 font-medium">Continue <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 duration-300" strokeWidth={2} /></span>
            </Button>
          ) : (
            <Button type="submit" disabled={isGenerating} className="w-full h-11 sm:h-12 hover:shadow-lg bg-primary text-white rounded-xl">
              <span className="flex items-center justify-center gap-2 font-medium">{isGenerating ? "Crafting Your Journey..." : "Generate Optimized Trip"} {!isGenerating && <Check className="h-4 w-4 ml-1" strokeWidth={2} />}</span>
            </Button>
          )}
          {currentStep > 0 && <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="w-full text-center text-sm text-muted-foreground/60 hover:text-foreground/80">Go back</button>}
        </div>
      </form>
    </Form>
  );
});

export default AiArchitectForm;
