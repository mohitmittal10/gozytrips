"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Hotel, Plane, Plus, Minus, Trash2, Star, ChevronDown, X, Camera, Car, Bus, Minimize2, Maximize2, AlertCircle, AlertTriangle
} from "lucide-react";
import { CustomTabs } from "@/components/ui/custom-tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  validateLogisticsEntry,
  isEntryCompleteForExport,
  LOGISTICS_REQUIRED_FIELDS,
} from "@/lib/validation/logistics-validation";

// ── Types ──────────────────────────────────────────────────────────────────────

export type HotelInfo = {
  id: string;
  dayIndex: number;        // primary day (first selected day, for backward compat)
  dayIndices?: number[];   // all selected days (undefined = just dayIndex)
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  bookingRef: string;
  starRating: number;
  nights?: number;
  costAdult?: number;
  costChild?: number;
  costInfant?: number;
  imageUrls?: string[];
};

export type FlightInfo = {
  id: string;
  dayIndex: number;
  dayIndices?: number[];
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  departureAirport: string;
  arrivalAirport: string;
  terminal: string;
  pnr: string;
  layover?: string;
  flightType?: 'direct' | 'connecting';
  connectingAirline?: string;
  connectingFlightNumber?: string;
  connectingDeparture?: string;
  connectingArrival?: string;
  connectingDepartureAirport?: string;
  connectingArrivalAirport?: string;
  connectingTerminal?: string;
  connectingPnr?: string;
  costAdult?: number;
  costChild?: number;
  costInfant?: number;
};

export type CabInfo = {
  id: string;
  dayIndex: number;
  dayIndices?: number[];
  vehicleType: string;
  route: string;
  pickupTime: string;
  driverName: string;
  driverContact: string;
  bookingRef: string;
  totalCost?: number;
};

export type BusInfo = {
  id: string;
  dayIndex: number;
  dayIndices?: number[];
  busType: string;
  route: string;
  reportingTime: string;
  departureTime: string;
  pnr: string;
  costAdult?: number;
  costChild?: number;
  costInfant?: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

let _idCounter = 0;
const uid = () => `hf-${Date.now()}-${++_idCounter}`;

const emptyHotel = (dayIndex: number): HotelInfo => ({
  id: uid(), dayIndex, dayIndices: [], nights: 0, name: "", address: "", checkIn: "2:00 PM", checkOut: "11:00 AM", bookingRef: "", starRating: 3,
});

const emptyFlight = (dayIndex: number): FlightInfo => ({
  id: uid(), dayIndex, dayIndices: [], airline: "", flightNumber: "", departure: "", arrival: "", departureAirport: "", arrivalAirport: "", terminal: "", pnr: "", layover: "", flightType: "direct",
  connectingAirline: "", connectingFlightNumber: "", connectingDeparture: "", connectingArrival: "", connectingDepartureAirport: "", connectingArrivalAirport: "", connectingTerminal: "", connectingPnr: "",
});

const emptyCab = (dayIndex: number): CabInfo => ({
  id: uid(), dayIndex, dayIndices: [], vehicleType: "SUV", route: "", pickupTime: "9:00 AM", driverName: "", driverContact: "", bookingRef: "", totalCost: undefined,
});

const emptyBus = (dayIndex: number): BusInfo => ({
  id: uid(), dayIndex, dayIndices: [], busType: "Volvo AC", route: "", reportingTime: "8:30 AM", departureTime: "9:00 AM", pnr: "",
});

// ── Star Rating ────────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="p-0.5 transition-colors"
        >
          <Star
            className={cn(
              "w-4 h-4 transition-colors",
              s <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ── Field Row ──────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  type = "text",
  required = false,
  error,
  id,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  type?: string;
  required?: boolean;
  error?: string;
  id?: string;
}) {
  const fieldId = id || `field-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={fieldId} className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center">
        <span>{label}</span>
        {required && <span className="text-rose-400 font-bold ml-0.5" title="Required field">*</span>}
      </label>
      <Input
        id={fieldId}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(
          "the-lab-input h-8 text-sm transition-colors",
          error
            ? "border-rose-500/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 bg-rose-500/5 text-rose-200 placeholder:text-rose-400/40"
            : "border-white/10"
        )}
      />
      {error && (
        <p id={`${fieldId}-error`} className="text-[11px] text-rose-400 font-medium mt-0.5 flex items-center gap-1 animate-in fade-in duration-150">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// ── Day Multi Picker ──────────────────────────────────────────────────────────

function DayMultiPicker({ selectedDays, onChange, totalDays, label = "Select Days", occupiedInfo, onClaimDay }: {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  totalDays: number;
  label?: string;
  occupiedInfo?: Map<number, string>;
  onClaimDay?: (dayIndex: number) => void;
}) {
  const [conflictPending, setConflictPending] = useState<{ dayIndex: number; existingHotelName: string } | null>(null);

  const doToggle = (idx: number, proceedClaim = false) => {
    if (proceedClaim && onClaimDay) {
      onClaimDay(idx);
    }
    const current = new Set(selectedDays);
    if (current.has(idx)) {
      current.delete(idx);
    } else {
      current.add(idx);
    }
    onChange(Array.from(current).sort((a, b) => a - b));
  };

  const handleDayClick = (i: number) => {
    if (selectedDays.includes(i)) {
      doToggle(i);
      return;
    }
    const ownerLabel = occupiedInfo?.get(i);
    if (ownerLabel) {
      setConflictPending({ dayIndex: i, existingHotelName: ownerLabel });
    } else {
      doToggle(i);
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 space-y-3 relative">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
          {selectedDays.length} Day{selectedDays.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: totalDays }, (_, i) => {
          const isSelected = selectedDays.includes(i);
          const isOccupied = !isSelected && !!occupiedInfo?.has(i);
          const isPending = conflictPending?.dayIndex === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(i)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 select-none flex items-center gap-1",
                isSelected
                  ? "bg-primary text-white border-primary shadow-sm shadow-primary/30 cursor-pointer hover:bg-primary/85"
                  : isOccupied
                    ? isPending
                      ? "bg-amber-500/20 text-amber-300 border-amber-400/50 cursor-pointer ring-1 ring-amber-400/30"
                      : "bg-amber-500/8 text-amber-300/70 border-amber-500/20 cursor-pointer hover:bg-amber-500/15 hover:text-amber-300 hover:border-amber-500/40"
                    : "bg-white/5 text-gray-400 border-white/10 hover:border-primary/40 hover:text-gray-200 hover:bg-white/8 cursor-pointer"
              )}
            >
              Day {i + 1}
              {isOccupied && (
                <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-amber-500/30 text-[7px] font-black text-amber-300">!</span>
              )}
              {isSelected && <span className="text-white/50 text-[9px]">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Same Day Hotel Warning Modal / Confirmation Banner */}
      {conflictPending !== null && (
        <div className="mt-3 p-4 rounded-2xl bg-zinc-950/90 border border-amber-500/25 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-200 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-zinc-100">Hotel Selection Conflict</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                  Day {conflictPending.dayIndex + 1}
                </span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[12px]">
                Day {conflictPending.dayIndex + 1} is currently assigned to <strong className="text-zinc-100 font-semibold px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{conflictPending.existingHotelName}</strong>. Would you like to reassign this day to the current hotel?
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setConflictPending(null)}
              className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer select-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                doToggle(conflictPending.dayIndex, true);
                setConflictPending(null);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer select-none"
            >
              Proceed & Reassign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hotel Card ────────────────────────────────────────────────────────────────

function HotelCard({ hotel, totalDays, onChange, onDelete, isCollapsed, allHotels = [], onClaimDay }: {
  hotel: HotelInfo; totalDays: number;
  onChange: (updated: HotelInfo) => void; onDelete: () => void;
  isCollapsed?: boolean;
  allHotels?: HotelInfo[];
  onClaimDay?: (dayIndex: number) => void;
}) {
  const [touched, setTouched] = useState(false);
  const selectedDays = hotel.dayIndices ?? [hotel.dayIndex];

  const validation = validateLogisticsEntry(hotel, "hotel");
  const isComplete = validation.isValid;
  const errors = touched ? validation.errors : {};

  const handleBlur = () => setTouched(true);

  const update = (field: keyof HotelInfo, value: any) =>
    onChange({ ...hotel, [field]: value } as any);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const currentUrls = hotel.imageUrls || [];
      if (currentUrls.length >= 2) return;
      setIsUploadingPhoto(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          update("imageUrls", [...currentUrls, resultUrl]);
          setIsUploadingPhoto(false);
        };
        img.onerror = () => {
          update("imageUrls", [...currentUrls, resultUrl]);
          setIsUploadingPhoto(false);
        };
        img.src = resultUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const currentUrls = hotel.imageUrls || [];
    const newUrls = [...currentUrls];
    newUrls.splice(index, 1);
    update("imageUrls", newUrls.length > 0 ? newUrls : undefined);
  };

  const occupiedInfo = useMemo(() => {
    const map = new Map<number, string>();
    allHotels.forEach((h) => {
      if (h.id === hotel.id) return;
      const days = h.dayIndices?.length ? h.dayIndices : [h.dayIndex];
      const nameLabel = h.name.trim() || "Another Hotel";
      days.forEach((d) => {
        map.set(d, nameLabel);
      });
    });
    return map;
  }, [allHotels, hotel.id, hotel.name]);

  if (isCollapsed) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between gap-4 transition-all animate-in fade-in duration-200 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Hotel className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{hotel.name || "Untitled Hotel"}</span>
              {!isComplete && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-amber-300 bg-amber-500/[0.12] border-l-2 border-amber-400 pl-1.5 pr-2 py-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Incomplete — excluded from PDF
                </span>
              )}
            </div>
            {hotel.address && <p className="text-xs text-gray-400 mt-1">{hotel.address}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StarRating value={hotel.starRating} onChange={(v) => update("starRating", v)} />
          <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Hotel className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-primary">Hotel</span>
          {!isComplete && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-amber-300 bg-amber-500/[0.12] border-l-2 border-amber-400 pl-1.5 pr-2 py-0.5">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Incomplete — excluded from PDF
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StarRating value={hotel.starRating} onChange={(v) => update("starRating", v)} />
          <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <DayMultiPicker selectedDays={selectedDays} onChange={(days) => onChange({ ...hotel, dayIndices: days, dayIndex: days[0] ?? 0 })} totalDays={totalDays} label="Select Stay Days" occupiedInfo={occupiedInfo} onClaimDay={onClaimDay} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Hotel Name" required value={hotel.name} onChange={(v) => update("name", v)} onBlur={handleBlur} error={errors.name} placeholder="e.g. The Taj Palace" className="col-span-2" />
        <Field label="Address / Location" required value={hotel.address} onChange={(v) => update("address", v)} onBlur={handleBlur} error={errors.address} placeholder="123 Main Street, City" className="col-span-2" />
        <Field label="Check In Time" required value={hotel.checkIn} onChange={(v) => update("checkIn", v)} onBlur={handleBlur} error={errors.checkIn} placeholder="2:00 PM" />
        <Field label="Check Out Time" required value={hotel.checkOut} onChange={(v) => update("checkOut", v)} onBlur={handleBlur} error={errors.checkOut} placeholder="11:00 AM" />
        <Field label="Booking Ref (Optional)" value={hotel.bookingRef} onChange={(v) => update("bookingRef", v)} placeholder="CONF-12345" className="col-span-2" />
      </div>

      <div className="pt-2 border-t border-white/5 space-y-2 mt-2!">
        <label className="text-xs font-semibold text-gray-400">Costs (Per Night — Optional)</label>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Adult Cost" type="number" value={hotel.costAdult} onChange={(v) => update("costAdult", v ? Number(v) : undefined)} placeholder="0" />
          <Field label="Child Cost" type="number" value={hotel.costChild} onChange={(v) => update("costChild", v ? Number(v) : undefined)} placeholder="0" />
          <Field label="Infant Cost" type="number" value={hotel.costInfant} onChange={(v) => update("costInfant", v ? Number(v) : undefined)} placeholder="0" />
        </div>
      </div>

      {/* Photo Upload — Explicitly Optional */}
      <div className="pt-2 border-t border-white/5 space-y-2 mt-2!">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <span>Hotel Photos</span>
            <span className="text-[10px] text-zinc-500 font-normal">(Optional — Max 2 images)</span>
          </label>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-4 flex-wrap">
            {(hotel.imageUrls || []).map((url, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 group/img flex-shrink-0">
                <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {isUploadingPhoto && (
              <div className="relative flex items-center justify-center w-24 h-24 flex-shrink-0 rounded-lg border border-primary/40 bg-black/60 shadow-inner">
                <div className="flex flex-col items-center gap-1.5 text-primary">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[9px] font-semibold text-white/90">Loading…</span>
                </div>
              </div>
            )}
            {(!hotel.imageUrls || hotel.imageUrls.length < 2) && !isUploadingPhoto && (
              <div className="relative flex items-center justify-center w-24 h-24 flex-shrink-0 rounded-lg border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group/upload">
                <div className="flex flex-col items-center gap-1 text-gray-400 group-hover/upload:text-white transition-colors">
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] uppercase font-semibold text-center leading-tight">Upload<br />({(hotel.imageUrls || []).length}/2)</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Flight Card ───────────────────────────────────────────────────────────────

function FlightCard({ flight, totalDays, onChange, onDelete, isCollapsed, allFlights = [] }: {
  flight: FlightInfo; totalDays: number;
  onChange: (updated: FlightInfo) => void; onDelete: () => void;
  isCollapsed?: boolean;
  allFlights?: FlightInfo[];
}) {
  const [touched, setTouched] = useState(false);
  const selectedDays = flight.dayIndices ?? [flight.dayIndex];

  const validation = validateLogisticsEntry(flight, "flight");
  const isComplete = validation.isValid;
  const errors = touched ? validation.errors : {};

  const handleBlur = () => setTouched(true);

  const update = (field: keyof FlightInfo, value: string | number | undefined) =>
    onChange({ ...flight, [field]: value } as any);

  if (isCollapsed) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between gap-4 transition-all animate-in fade-in duration-200 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Plane className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">
                {flight.airline || "Untitled Airline"} {flight.flightNumber}
              </span>
              {!isComplete && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-amber-300 bg-amber-500/[0.12] border-l-2 border-amber-400 pl-1.5 pr-2 py-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Incomplete — excluded from PDF
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {flight.departureAirport || "DEP"} → {flight.arrivalAirport || "ARR"}
            </p>
          </div>
        </div>
        <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Plane className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-primary">Flight</span>
          {!isComplete && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-amber-300 bg-amber-500/[0.12] border-l-2 border-amber-400 pl-1.5 pr-2 py-0.5">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Incomplete — excluded from PDF
            </span>
          )}
        </div>
        <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <DayMultiPicker selectedDays={selectedDays} onChange={(days) => onChange({ ...flight, dayIndices: days, dayIndex: days[0] ?? 0 })} totalDays={totalDays} label="Select Flight Day(s)" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Airline" required value={flight.airline} onChange={(v) => update("airline", v)} onBlur={handleBlur} error={errors.airline} placeholder="Air India" />
        <Field label="Flight No." required value={flight.flightNumber} onChange={(v) => update("flightNumber", v)} onBlur={handleBlur} error={errors.flightNumber} placeholder="AI 302" />
        <Field label="From (Airport)" required value={flight.departureAirport} onChange={(v) => update("departureAirport", v)} onBlur={handleBlur} error={errors.departureAirport} placeholder="DEL — Delhi" />
        <Field label="To (Airport)" required value={flight.arrivalAirport} onChange={(v) => update("arrivalAirport", v)} onBlur={handleBlur} error={errors.arrivalAirport} placeholder="BOM — Mumbai" />
        <Field label="Departure Time" required value={flight.departure} onChange={(v) => update("departure", v)} onBlur={handleBlur} error={errors.departure} placeholder="06:30 AM" />
        <Field label="Arrival Time" required value={flight.arrival} onChange={(v) => update("arrival", v)} onBlur={handleBlur} error={errors.arrival} placeholder="09:15 AM" />

        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Flight Type</label>
          <Select value={flight.flightType || "direct"} onValueChange={(v) => update("flightType", v as any)}>
            <SelectTrigger className="the-lab-input h-8 text-sm bg-black/20 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-obsidian-dark border-white/5 text-zinc-300">
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="connecting">Connecting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Field label="Terminal (Optional)" value={flight.terminal} onChange={(v) => update("terminal", v)} placeholder="T3" />
        <Field label="PNR / Booking Ref (Optional)" value={flight.pnr} onChange={(v) => update("pnr", v)} placeholder="PNR-1234" className="col-span-2" />

        {flight.flightType === 'connecting' && (
          <div className="col-span-2 space-y-3 pt-2 border-t border-white/5 mt-2!">
            <label className="text-xs font-semibold text-primary">Connecting Flight Leg Details</label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Connecting Airline" required value={flight.connectingAirline} onChange={(v) => update("connectingAirline", v)} onBlur={handleBlur} error={errors.connectingAirline} placeholder="e.g. Emirates" />
              <Field label="Connecting Flight No." required value={flight.connectingFlightNumber} onChange={(v) => update("connectingFlightNumber", v)} onBlur={handleBlur} error={errors.connectingFlightNumber} placeholder="e.g. EK 501" />
              <Field label="Connecting From" required value={flight.connectingDepartureAirport} onChange={(v) => update("connectingDepartureAirport", v)} onBlur={handleBlur} error={errors.connectingDepartureAirport} placeholder="e.g. DXB" />
              <Field label="Connecting To" required value={flight.connectingArrivalAirport} onChange={(v) => update("connectingArrivalAirport", v)} onBlur={handleBlur} error={errors.connectingArrivalAirport} placeholder="e.g. LHR" />
              <Field label="Connecting Departure" required value={flight.connectingDeparture} onChange={(v) => update("connectingDeparture", v)} onBlur={handleBlur} error={errors.connectingDeparture} placeholder="e.g. 02:15 PM" />
              <Field label="Connecting Arrival" required value={flight.connectingArrival} onChange={(v) => update("connectingArrival", v)} onBlur={handleBlur} error={errors.connectingArrival} placeholder="e.g. 06:40 PM" />
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-white/5 space-y-2 mt-2!">
        <label className="text-xs font-semibold text-gray-400">Costs (Optional)</label>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Adult Cost" type="number" value={flight.costAdult} onChange={(v) => update("costAdult", v ? Number(v) : undefined)} placeholder="0" />
          <Field label="Child Cost" type="number" value={flight.costChild} onChange={(v) => update("costChild", v ? Number(v) : undefined)} placeholder="0" />
          <Field label="Infant Cost" type="number" value={flight.costInfant} onChange={(v) => update("costInfant", v ? Number(v) : undefined)} placeholder="0" />
        </div>
      </div>
    </div>
  );
}

// ── Cab Card ─────────────────────────────────────────────────────────────────

function CabCard({ cab, totalDays, onChange, onDelete, isCollapsed, allCabs = [] }: {
  cab: CabInfo; totalDays: number;
  onChange: (updated: CabInfo) => void; onDelete: () => void;
  isCollapsed?: boolean;
  allCabs?: CabInfo[];
}) {
  const [touched, setTouched] = useState(false);
  const selectedDays = cab.dayIndices ?? [cab.dayIndex];

  const validation = validateLogisticsEntry(cab, "cab");
  const isComplete = validation.isValid;
  const errors = touched ? validation.errors : {};

  const handleBlur = () => setTouched(true);

  const update = (field: keyof CabInfo, value: any) =>
    onChange({ ...cab, [field]: value } as any);

  if (isCollapsed) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between gap-4 transition-all animate-in fade-in duration-200 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{cab.vehicleType || "Cab Transfer"}</span>
              {!isComplete && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-amber-300 bg-amber-500/[0.12] border-l-2 border-amber-400 pl-1.5 pr-2 py-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Incomplete — excluded from PDF
                </span>
              )}
            </div>
            {cab.route && <p className="text-xs text-gray-400 mt-1">{cab.route}</p>}
          </div>
        </div>
        <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Car className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-primary">Cab / Taxi</span>
          {!isComplete && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-amber-300 bg-amber-500/[0.12] border-l-2 border-amber-400 pl-1.5 pr-2 py-0.5">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Incomplete — excluded from PDF
            </span>
          )}
        </div>
        <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <DayMultiPicker selectedDays={selectedDays} onChange={(days) => onChange({ ...cab, dayIndices: days, dayIndex: days[0] ?? 0 })} totalDays={totalDays} label="Select Transfer Day(s)" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Vehicle Type" required value={cab.vehicleType} onChange={(v) => update("vehicleType", v)} onBlur={handleBlur} error={errors.vehicleType} placeholder="Sedan / SUV" />
        <Field label="Route" required value={cab.route} onChange={(v) => update("route", v)} onBlur={handleBlur} error={errors.route} placeholder="Delhi — Agra" />
        <Field label="Pickup Time" required value={cab.pickupTime} onChange={(v) => update("pickupTime", v)} onBlur={handleBlur} error={errors.pickupTime} placeholder="09:00 AM" />
        <Field label="Driver Name" required value={cab.driverName} onChange={(v) => update("driverName", v)} onBlur={handleBlur} error={errors.driverName} placeholder="Rajesh Kumar" />
        <Field label="Driver Contact" required value={cab.driverContact} onChange={(v) => update("driverContact", v)} onBlur={handleBlur} error={errors.driverContact} placeholder="+91 98765 43210" className="col-span-2" />
        <Field label={`Total Cost (${getCurrencySymbol(DEFAULT_CURRENCY)}) (Optional)`} type="number" value={cab.totalCost} onChange={(v) => update("totalCost", v ? Number(v) : undefined)} placeholder="0" className="col-span-2" />
      </div>
    </div>
  );
}

// ── Bus Card ──────────────────────────────────────────────────────────────────

function BusCard({ bus, totalDays, onChange, onDelete, isCollapsed, allBuses = [] }: {
  bus: BusInfo; totalDays: number;
  onChange: (updated: BusInfo) => void; onDelete: () => void;
  isCollapsed?: boolean;
  allBuses?: BusInfo[];
}) {
  const [touched, setTouched] = useState(false);
  const selectedDays = bus.dayIndices ?? [bus.dayIndex];

  const validation = validateLogisticsEntry(bus, "bus");
  const isComplete = validation.isValid;
  const errors = touched ? validation.errors : {};

  const handleBlur = () => setTouched(true);

  const update = (field: keyof BusInfo, value: any) =>
    onChange({ ...bus, [field]: value } as any);

  if (isCollapsed) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between gap-4 transition-all animate-in fade-in duration-200 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Bus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{bus.busType || "Bus Transfer"}</span>
              {!isComplete && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-amber-300 bg-amber-500/[0.12] border-l-2 border-amber-400 pl-1.5 pr-2 py-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Incomplete — excluded from PDF
                </span>
              )}
            </div>
            {bus.route && <p className="text-xs text-gray-400 mt-1">{bus.route}</p>}
          </div>
        </div>
        <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Bus className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-primary">Tourist Bus</span>
          {!isComplete && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-amber-300 bg-amber-500/[0.12] border-l-2 border-amber-400 pl-1.5 pr-2 py-0.5">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Incomplete — excluded from PDF
            </span>
          )}
        </div>
        <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <DayMultiPicker selectedDays={selectedDays} onChange={(days) => onChange({ ...bus, dayIndices: days, dayIndex: days[0] ?? 0 })} totalDays={totalDays} label="Select Journey Day(s)" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Bus Type / Name" required value={bus.busType} onChange={(v) => update("busType", v)} onBlur={handleBlur} error={errors.busType} placeholder="Volvo Multi-Axle AC" />
        <Field label="Route / Destination" required value={bus.route} onChange={(v) => update("route", v)} onBlur={handleBlur} error={errors.route} placeholder="Manali — Chandigarh" />
        <Field label="Reporting Time" required value={bus.reportingTime} onChange={(v) => update("reportingTime", v)} onBlur={handleBlur} error={errors.reportingTime} placeholder="08:30 PM" />
        <Field label="Departure Time" required value={bus.departureTime} onChange={(v) => update("departureTime", v)} onBlur={handleBlur} error={errors.departureTime} placeholder="09:00 PM" />
        <Field label="PNR / Ticket No." required value={bus.pnr} onChange={(v) => update("pnr", v)} onBlur={handleBlur} error={errors.pnr} placeholder="BUS-PNR-123" className="col-span-2" />
      </div>

      <div className="pt-2 border-t border-white/5 space-y-2 mt-2!">
        <label className="text-xs font-semibold text-gray-400">Costs (Per Seat — Optional)</label>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Adult Cost" type="number" value={bus.costAdult} onChange={(v) => update("costAdult", v ? Number(v) : undefined)} placeholder="0" />
          <Field label="Child Cost" type="number" value={bus.costChild} onChange={(v) => update("costChild", v ? Number(v) : undefined)} placeholder="0" />
          <Field label="Infant Cost" type="number" value={bus.costInfant} onChange={(v) => update("costInfant", v ? Number(v) : undefined)} placeholder="0" />
        </div>
      </div>
    </div>
  );
}

// ── Main HotelFlightEditor Component ──────────────────────────────────────────

interface HotelFlightEditorProps {
  hotels: HotelInfo[];
  flights: FlightInfo[];
  cabs: CabInfo[];
  buses: BusInfo[];
  totalDays: number;
  currency?: string;
  onHotelsChange: (hotels: HotelInfo[]) => void;
  onFlightsChange: (flights: FlightInfo[]) => void;
  onCabsChange: (cabs: CabInfo[]) => void;
  onBusesChange: (buses: BusInfo[]) => void;
}

export default function HotelFlightEditor({
  hotels = [],
  flights = [],
  cabs = [],
  buses = [],
  totalDays,
  currency,
  onHotelsChange,
  onFlightsChange,
  onCabsChange,
  onBusesChange,
}: HotelFlightEditorProps) {
  const [selectedEditorTab, setSelectedEditorTab] = useState<string>("hotels");
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const firstRender = useRef(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const TAB_CONFIG = useMemo(() => [
    { value: "hotels", label: "Hotels", icon: Hotel, description: "Manage accommodation for each day", count: hotels.length },
    { value: "flights", label: "Flights", icon: Plane, description: "Manage flight transfers", count: flights.length },
    { value: "cabs", label: "Cabs", icon: Car, description: "Manage private transfers", count: cabs.length },
    { value: "buses", label: "Buses", icon: Bus, description: "Manage bus tickets", count: buses.length },
  ], [hotels.length, flights.length, cabs.length, buses.length]);

  useEffect(() => {
    const idx = TAB_CONFIG.findIndex(t => t.value === selectedEditorTab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    firstRender.current = false;
  }, [selectedEditorTab, TAB_CONFIG]);

  const handleTabClick = (tabKey: string) => {
    if (tabKey === "hotels") onHotelsChange([...hotels, emptyHotel(0)]);
    else if (tabKey === "flights") onFlightsChange([...flights, emptyFlight(0)]);
    else if (tabKey === "cabs") onCabsChange([...cabs, emptyCab(0)]);
    else if (tabKey === "buses") onBusesChange([...buses, emptyBus(0)]);
  };

  const handleTabSelect = (value: string) => {
    const oldIdx = TAB_CONFIG.findIndex(t => t.value === selectedEditorTab);
    const newIdx = TAB_CONFIG.findIndex(t => t.value === value);
    setSlideDir(newIdx > oldIdx ? "right" : "left");
    setSelectedEditorTab(value);
  };

  const updateHotel = (id: string, updated: HotelInfo) =>
    onHotelsChange(hotels.map((h) => (h.id === id ? updated : h)));

  const updateFlight = (id: string, updated: FlightInfo) =>
    onFlightsChange(flights.map((f) => (f.id === id ? updated : f)));

  const updateCab = (id: string, updated: CabInfo) =>
    onCabsChange(cabs.map((c) => (c.id === id ? updated : c)));

  const updateBus = (id: string, updated: BusInfo) =>
    onBusesChange(buses.map((b) => (b.id === id ? updated : b)));

  const deleteHotel = (id: string) => onHotelsChange(hotels.filter((h) => h.id !== id));
  const deleteFlight = (id: string) => onFlightsChange(flights.filter((f) => f.id !== id));
  const deleteCab = (id: string) => onCabsChange(cabs.filter((c) => c.id !== id));
  const deleteBus = (id: string) => onBusesChange(buses.filter((b) => b.id !== id));

  const claimDayForHotel = (claimingHotelId: string, dayIndex: number) => {
    const updatedHotels = hotels.map((h) => {
      if (h.id === claimingHotelId) return h;
      const days = h.dayIndices?.length ? h.dayIndices : [h.dayIndex];
      if (days.includes(dayIndex)) {
        const newDays = days.filter((d) => d !== dayIndex);
        return {
          ...h,
          dayIndices: newDays,
          dayIndex: newDays[0] ?? 0,
        };
      }
      return h;
    });
    onHotelsChange(updatedHotels);
  };

  const active = TAB_CONFIG.find(t => t.value === selectedEditorTab)!;
  const Icon = active.icon;

  return (
    <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      <style>{`
        @keyframes slideFromRight { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideFromLeft  { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      {/* Required Legend Bar */}
      <div className="flex items-center justify-between px-2 mb-3 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-rose-400 font-bold text-sm">*</span>
          <span>Indicates required field</span>
          <span className="text-zinc-600 font-normal">| Only fully-completed entries are exported to PDF</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 mb-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="relative flex gap-1 pb-[1px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {TAB_CONFIG.map((tab, i) => {
              const isSelected = selectedEditorTab === tab.value;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.value}
                  ref={el => { tabRefs.current[i] = el; }}
                  onClick={() => handleTabSelect(tab.value)}
                  type="button"
                  className={`flex items-center gap-1.5 px-3 pb-[8px] pt-1 cursor-pointer font-sans text-sm font-semibold transition-colors duration-200 select-none rounded-t-sm ${
                    isSelected
                      ? "text-primary"
                      : "text-foreground/40 hover:text-foreground/70"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                    isSelected ? "bg-primary/20 text-primary" : "bg-white/5 text-foreground/40"
                  }`}>{tab.count}</span>
                </button>
              );
            })}
            <div
              className="absolute bottom-0 h-[2px] rounded-full bg-primary shadow-[0_0_8px_rgba(255,92,51,0.5)]"
              style={{
                left: indicator.left,
                width: indicator.width,
                transition: firstRender.current ? 'none' : 'left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">{active.label}</p>
                <p className="text-[11px] text-foreground/40 mt-0.5 leading-none">{active.description}</p>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-white/[0.08] hidden sm:block" />

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/80 hover:text-white text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer select-none animate-in fade-in duration-200"
            >
              {isCollapsed ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Edit Mode</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Collapse View</span>
                </>
              )}
            </button>

            <div className="h-6 w-[1px] bg-white/[0.08] hidden sm:block" />

            <button
              type="button"
              onClick={() => handleTabClick(selectedEditorTab)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-bold hover:bg-primary/10 transition-all cursor-pointer animate-in fade-in duration-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Add {selectedEditorTab === "flights" ? "Flight" : selectedEditorTab === "hotels" ? "Hotel" : selectedEditorTab === "cabs" ? "Cab" : "Bus"}
            </button>
          </div>
        </div>
      </div>

      {/* Content pane */}
      <div
        key={selectedEditorTab}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: `${slideDir === 'right' ? 'slideFromRight' : 'slideFromLeft'} 0.22s cubic-bezier(0.4,0,0.2,1) both` }}
      >
        <div className="p-6 lg:p-8">
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar min-h-[200px]">
            {selectedEditorTab === "hotels"
              ? hotels.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    totalDays={totalDays}
                    onChange={(updated) => updateHotel(hotel.id, updated)}
                    onDelete={() => deleteHotel(hotel.id)}
                    isCollapsed={isCollapsed}
                    allHotels={hotels}
                    onClaimDay={(dayIdx) => claimDayForHotel(hotel.id, dayIdx)}
                  />
                ))
              : null}

            {selectedEditorTab === "flights"
              ? flights.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    totalDays={totalDays}
                    onChange={(updated) => updateFlight(flight.id, updated)}
                    onDelete={() => deleteFlight(flight.id)}
                    isCollapsed={isCollapsed}
                    allFlights={flights}
                  />
                ))
              : null}

            {selectedEditorTab === "cabs"
              ? cabs.map((cab) => (
                  <CabCard
                    key={cab.id}
                    cab={cab}
                    totalDays={totalDays}
                    onChange={(updated) => updateCab(cab.id, updated)}
                    onDelete={() => deleteCab(cab.id)}
                    isCollapsed={isCollapsed}
                    allCabs={cabs}
                  />
                ))
              : null}

            {selectedEditorTab === "buses"
              ? buses.map((bus) => (
                  <BusCard
                    key={bus.id}
                    bus={bus}
                    totalDays={totalDays}
                    onChange={(updated) => updateBus(bus.id, updated)}
                    onDelete={() => deleteBus(bus.id)}
                    isCollapsed={isCollapsed}
                    allBuses={buses}
                  />
                ))
              : null}

            {((selectedEditorTab === "hotels" && hotels.length === 0) ||
              (selectedEditorTab === "flights" && flights.length === 0) ||
              (selectedEditorTab === "cabs" && cabs.length === 0) ||
              (selectedEditorTab === "buses" && buses.length === 0)) && (
                <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                  <div className="p-3 rounded-full bg-primary/10 mb-3">
                    <Plus className="w-6 h-6 text-primary/70" />
                  </div>
                  <p className="text-gray-400 font-medium">No {selectedEditorTab} added yet</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Click <span className="text-primary font-semibold">Add {selectedEditorTab === "flights" ? "Flight" : selectedEditorTab === "hotels" ? "Hotel" : selectedEditorTab === "cabs" ? "Cab" : "Bus"}</span> to get started.
                  </p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
