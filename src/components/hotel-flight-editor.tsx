"use client";

import { useState, useRef, useEffect } from "react";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Hotel, Plane, Plus, Minus, Trash2, Star, ChevronDown, X, Camera, Car, Bus, Minimize2, Maximize2
} from "lucide-react";
import { CustomTabs } from "@/components/ui/custom-tabs";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
    id: uid(), dayIndex, dayIndices: [dayIndex], nights: 1, name: "", address: "", checkIn: "2:00 PM", checkOut: "11:00 AM", bookingRef: "", starRating: 3,
});

const emptyFlight = (dayIndex: number): FlightInfo => ({
    id: uid(), dayIndex, airline: "", flightNumber: "", departure: "", arrival: "", departureAirport: "", arrivalAirport: "", terminal: "", pnr: "", layover: "", flightType: "direct",
    connectingAirline: "", connectingFlightNumber: "", connectingDeparture: "", connectingArrival: "", connectingDepartureAirport: "", connectingArrivalAirport: "", connectingTerminal: "", connectingPnr: "",
});

const emptyCab = (dayIndex: number): CabInfo => ({
    id: uid(), dayIndex, vehicleType: "SUV", route: "", pickupTime: "9:00 AM", driverName: "", driverContact: "", bookingRef: "", totalCost: undefined,
});

const emptyBus = (dayIndex: number): BusInfo => ({
    id: uid(), dayIndex, busType: "Volvo AC", route: "", reportingTime: "8:30 AM", departureTime: "9:00 AM", pnr: "",
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

function Field({ label, value, onChange, placeholder, className, type = "text" }: {
    label: string; value: string | number | undefined; onChange: (v: string) => void; placeholder?: string; className?: string; type?: string;
}) {
    return (
        <div className={cn("space-y-1", className)}>
            <label className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">{label}</label>
            <Input
                type={type}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="the-lab-input h-8 text-sm"
            />
        </div>
    );
}

// ── Day Selector ───────────────────────────────────────────────────────────────

function DaySelect({ value, onChange, totalDays }: { value: number; onChange: (v: number) => void; totalDays: number }) {
    return (
        <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
            <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-obsidian-dark border-white/5 text-zinc-300">
                {Array.from({ length: totalDays }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>Day {i + 1}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// ── Cards ──────────────────────────────────────────────────────────────────────

function HotelCard({ hotel, totalDays, onChange, onDelete, isCollapsed, occupiedDays = [], onClaimDay }: {
    hotel: HotelInfo; totalDays: number;
    onChange: (updated: HotelInfo) => void; onDelete: () => void;
    isCollapsed?: boolean;
    occupiedDays?: number[];  // days claimed by other hotels
    onClaimDay?: (dayIndex: number) => void; // move a taken day to this hotel
}) {
    const selectedDays = hotel.dayIndices?.length ? hotel.dayIndices : [hotel.dayIndex];

    const toggleDay = (idx: number) => {
        const current = new Set(selectedDays);
        if (current.has(idx)) {
            if (current.size === 1) return; // must keep at least 1
            current.delete(idx);
        } else {
            current.add(idx);
        }
        const sorted = Array.from(current).sort((a, b) => a - b);
        // nights auto-derived: 1 night per selected day
        onChange({ ...hotel, dayIndices: sorted, dayIndex: sorted[0], nights: sorted.length });
    };
    const update = (field: keyof HotelInfo, value: any) =>
        onChange({ ...hotel, [field]: value } as any);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const currentUrls = hotel.imageUrls || [];
            if (currentUrls.length >= 2) return;
            const reader = new FileReader();
            reader.onloadend = () => {
                update("imageUrls", [...currentUrls, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (index: number) => {
        const currentUrls = hotel.imageUrls || [];
        const newUrls = [...currentUrls];
        newUrls.splice(index, 1);
        update("imageUrls", newUrls.length > 0 ? newUrls : undefined);
    };

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
                            {selectedDays.map(d => (
                                <span key={d} className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">Day {d + 1}</span>
                            ))}
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{hotel.nights || 1} Night{(hotel.nights || 1) > 1 ? 's' : ''} each</span>
                        </div>
                        {hotel.address && <p className="text-xs text-gray-400 mt-1">{hotel.address}</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                            <span>In: {hotel.checkIn || "N/A"}</span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span>Out: {hotel.checkOut || "N/A"}</span>
                            {hotel.bookingRef && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span>Ref: {hotel.bookingRef}</span>
                                </>
                            )}
                        </div>
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
                <div className="flex flex-wrap items-center gap-2 flex-1">
                    <Hotel className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-primary shrink-0">Hotel — select days:</span>
                    <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: totalDays }, (_, i) => {
                            const isSelected = selectedDays.includes(i);
                            const isOccupied = !isSelected && occupiedDays.includes(i);
                            const isLastSelected = isSelected && selectedDays.length === 1;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        if (isOccupied) {
                                            onClaimDay?.(i);
                                        } else {
                                            toggleDay(i);
                                        }
                                    }}
                                    title={
                                        isOccupied
                                            ? 'Click to move this day to this hotel'
                                            : isLastSelected
                                                ? 'At least one day must be selected'
                                                : undefined
                                    }
                                    className={cn(
                                        "px-2 py-0.5 rounded-md text-xs font-semibold border transition-all select-none",
                                        isSelected
                                            ? isLastSelected
                                                ? "bg-primary text-white border-primary cursor-default opacity-80"
                                                : "bg-primary text-white border-primary shadow-sm shadow-primary/30 cursor-pointer hover:bg-primary/80"
                                            : isOccupied
                                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 cursor-pointer hover:bg-amber-500/20 hover:border-amber-400/60"
                                                : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-gray-200 cursor-pointer"
                                    )}
                                >
                                    Day {i + 1}
                                    {isOccupied && <span className="ml-1 text-[9px] font-bold opacity-80">→</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
                        <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                            {selectedDays.length} Night{selectedDays.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <StarRating value={hotel.starRating} onChange={(v) => update("starRating", v)} />
                    <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Hotel Name" value={hotel.name} onChange={(v) => update("name", v)} placeholder="e.g. The Taj Palace" className="col-span-2" />
                <Field label="Address" value={hotel.address} onChange={(v) => update("address", v)} placeholder="123 Main Street" className="col-span-2" />
                <Field label="Check-in" value={hotel.checkIn} onChange={(v) => update("checkIn", v)} placeholder="2:00 PM" />
                <Field label="Check-out" value={hotel.checkOut} onChange={(v) => update("checkOut", v)} placeholder="11:00 AM" />
                <Field label="Booking Ref" value={hotel.bookingRef} onChange={(v) => update("bookingRef", v)} placeholder="BK-12345" className="col-span-2" />
            </div>
            <div className="pt-2 border-t border-white/5 space-y-2 mt-2!">
                <label className="text-xs font-semibold text-gray-400">Costs (Optional)</label>
                <div className="grid grid-cols-3 gap-3">
                    <Field label="Adult Cost" type="number" value={hotel.costAdult} onChange={(v) => update("costAdult", v ? Number(v) : undefined)} placeholder="0" />
                    <Field label="Child Cost" type="number" value={hotel.costChild} onChange={(v) => update("costChild", v ? Number(v) : undefined)} placeholder="0" />
                    <Field label="Infant Cost" type="number" value={hotel.costInfant} onChange={(v) => update("costInfant", v ? Number(v) : undefined)} placeholder="0" />
                </div>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-2 mt-2!">
                <label className="text-xs font-semibold text-gray-400">Hotel Photos (Up to 2)</label>
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
                        {(!hotel.imageUrls || hotel.imageUrls.length < 2) && (
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

function FlightCard({ flight, totalDays, onChange, onDelete, isCollapsed }: {
    flight: FlightInfo; totalDays: number;
    onChange: (updated: FlightInfo) => void; onDelete: () => void;
    isCollapsed?: boolean;
}) {
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
                            <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">Day {flight.dayIndex + 1}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${flight.flightType === 'connecting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                {flight.flightType === 'connecting' ? 'Connecting' : 'Direct'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {flight.departureAirport || "DEP"} → {flight.arrivalAirport || "ARR"}
                            {flight.flightType === 'connecting' && flight.connectingArrivalAirport && ` → ${flight.connectingArrivalAirport}`}
                            {flight.terminal && <span className="text-gray-500 text-[10px] ml-1.5">(Term: {flight.terminal})</span>}
                            {flight.flightType === 'connecting' && flight.connectingTerminal && <span className="text-gray-500 text-[10px] ml-1.5">(Conn Term: {flight.connectingTerminal})</span>}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 flex-wrap">
                            {flight.flightType === 'connecting' ? (
                                <>
                                    <span>Leg 1: {flight.departure || "N/A"} - {flight.arrival || "N/A"}</span>
                                    {flight.connectingDeparture && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                            <span>Leg 2: {flight.connectingDeparture} - {flight.connectingArrival || "N/A"}</span>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <span>Dep: {flight.departure || "N/A"}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span>Arr: {flight.arrival || "N/A"}</span>
                                </>
                            )}
                            {flight.pnr && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span>PNR: {flight.pnr}</span>
                                </>
                            )}
                            {flight.flightType === 'connecting' && flight.connectingPnr && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span>Conn PNR: {flight.connectingPnr}</span>
                                </>
                            )}
                            {flight.layover && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span>Layover: {flight.layover}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center">
                    <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Flight</span>
                    <DaySelect value={flight.dayIndex} onChange={(v) => update("dayIndex", v)} totalDays={totalDays} />
                </div>
                <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Airline" value={flight.airline} onChange={(v) => update("airline", v)} placeholder="Air India" />
                <Field label="Flight No." value={flight.flightNumber} onChange={(v) => update("flightNumber", v)} placeholder="AI 302" />
                <Field label="From" value={flight.departureAirport} onChange={(v) => update("departureAirport", v)} placeholder="DEL — Delhi" />
                <Field label="To" value={flight.arrivalAirport} onChange={(v) => update("arrivalAirport", v)} placeholder="BOM — Mumbai" />
                <Field label="Departure" value={flight.departure} onChange={(v) => update("departure", v)} placeholder="06:30 AM" />
                <Field label="Arrival" value={flight.arrival} onChange={(v) => update("arrival", v)} placeholder="09:15 AM" />
                <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Flight Type</label>
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
                <Field label="Terminal" value={flight.terminal} onChange={(v) => update("terminal", v)} placeholder="T3" />
                <Field label="PNR" value={flight.pnr} onChange={(v) => update("pnr", v)} placeholder="ABC123" className="col-span-2" />
                {flight.flightType === 'connecting' && (
                    <Field label="Layover" value={flight.layover} onChange={(v) => update("layover", v)} placeholder="e.g. 2h 15m in BOM" className="col-span-2" />
                )}
                {flight.flightType === 'connecting' && (
                    <div className="col-span-2 space-y-3 pt-2 border-t border-white/5 mt-2!">
                        <label className="text-xs font-semibold text-primary">Connecting Flight Leg Details</label>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Connecting Airline" value={flight.connectingAirline} onChange={(v) => update("connectingAirline", v)} placeholder="e.g. Emirates" />
                            <Field label="Connecting Flight No." value={flight.connectingFlightNumber} onChange={(v) => update("connectingFlightNumber", v)} placeholder="e.g. EK 501" />
                            <Field label="Connecting From" value={flight.connectingDepartureAirport} onChange={(v) => update("connectingDepartureAirport", v)} placeholder="e.g. DXB" />
                            <Field label="Connecting To" value={flight.connectingArrivalAirport} onChange={(v) => update("connectingArrivalAirport", v)} placeholder="e.g. LHR" />
                            <Field label="Connecting Departure" value={flight.connectingDeparture} onChange={(v) => update("connectingDeparture", v)} placeholder="e.g. 02:15 PM" />
                            <Field label="Connecting Arrival" value={flight.connectingArrival} onChange={(v) => update("connectingArrival", v)} placeholder="e.g. 06:40 PM" />
                            <Field label="Connecting Terminal" value={flight.connectingTerminal} onChange={(v) => update("connectingTerminal", v)} placeholder="e.g. T3" />
                            <Field label="Connecting PNR" value={flight.connectingPnr} onChange={(v) => update("connectingPnr", v)} placeholder="e.g. XYZ987" />
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

function CabCard({ cab, totalDays, onChange, onDelete, isCollapsed }: {
    cab: CabInfo; totalDays: number;
    onChange: (updated: CabInfo) => void; onDelete: () => void;
    isCollapsed?: boolean;
}) {
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
                            <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">Day {cab.dayIndex + 1}</span>
                        </div>
                        {cab.route && <p className="text-xs text-gray-400 mt-1">{cab.route}</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                            <span>Pickup: {cab.pickupTime || "N/A"}</span>
                            {cab.driverName && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span>Driver: {cab.driverName}</span>
                                </>
                            )}
                            {cab.bookingRef && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span>Ref: {cab.bookingRef}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center">
                    <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Cab / Taxi</span>
                    <DaySelect value={cab.dayIndex} onChange={(v) => update("dayIndex", v)} totalDays={totalDays} />
                </div>
                <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Vehicle Type" value={cab.vehicleType} onChange={(v) => update("vehicleType", v)} placeholder="Sedan / SUV" />
                <Field label="Route" value={cab.route} onChange={(v) => update("route", v)} placeholder="Delhi — Agra" />
                <Field label="Pickup Time" value={cab.pickupTime} onChange={(v) => update("pickupTime", v)} placeholder="09:00 AM" />
                <Field label="Driver Contact" value={cab.driverContact} onChange={(v) => update("driverContact", v)} placeholder="+91 98765 43210" />
                <Field label="Driver Name" value={cab.driverName} onChange={(v) => update("driverName", v)} placeholder="Rajesh Kumar" />
                <Field label="Booking Ref" value={cab.bookingRef} onChange={(v) => update("bookingRef", v)} placeholder="CAB-XXXX" />
                <Field label={`Total Cost (${getCurrencySymbol(DEFAULT_CURRENCY)})`} type="number" value={cab.totalCost} onChange={(v) => update("totalCost", v ? Number(v) : undefined)} placeholder="0" className="col-span-2" />
            </div>
        </div>
    );
}

function BusCard({ bus, totalDays, onChange, onDelete, isCollapsed }: {
    bus: BusInfo; totalDays: number;
    onChange: (updated: BusInfo) => void; onDelete: () => void;
    isCollapsed?: boolean;
}) {
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
                            <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">Day {bus.dayIndex + 1}</span>
                        </div>
                        {bus.route && <p className="text-xs text-gray-400 mt-1">{bus.route}</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                            <span>Reporting: {bus.reportingTime || "N/A"}</span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span>Departure: {bus.departureTime || "N/A"}</span>
                            {bus.pnr && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span>PNR: {bus.pnr}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center">
                    <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Tourist Bus</span>
                    <DaySelect value={bus.dayIndex} onChange={(v) => update("dayIndex", v)} totalDays={totalDays} />
                </div>
                <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Bus Type / Name" value={bus.busType} onChange={(v) => update("busType", v)} placeholder="Volvo Multi-Axle AC" />
                <Field label="Route / Destination" value={bus.route} onChange={(v) => update("route", v)} placeholder="Manali — Chandigarh" />
                <Field label="Reporting Time" value={bus.reportingTime} onChange={(v) => update("reportingTime", v)} placeholder="08:30 AM" />
                <Field label="Departure Time" value={bus.departureTime} onChange={(v) => update("departureTime", v)} placeholder="09:00 AM" />
                <Field label="PNR / Ticket No." value={bus.pnr} onChange={(v) => update("pnr", v)} placeholder="BUS-PNR-123" className="col-span-2" />
            </div>
            <div className="pt-2 border-t border-white/5 space-y-2 mt-2!">
                <label className="text-xs font-semibold text-gray-400">Costs (Per Seat)</label>
                <div className="grid grid-cols-3 gap-3">
                    <Field label="Adult Cost" type="number" value={bus.costAdult} onChange={(v) => update("costAdult", v ? Number(v) : undefined)} placeholder="0" />
                    <Field label="Child Cost" type="number" value={bus.costChild} onChange={(v) => update("costChild", v ? Number(v) : undefined)} placeholder="0" />
                    <Field label="Infant Cost" type="number" value={bus.costInfant} onChange={(v) => update("costInfant", v ? Number(v) : undefined)} placeholder="0" />
                </div>
            </div>
        </div>
    );
}

// ── Main Editor ────────────────────────────────────────────────────────────────

export type HotelFlightEditorProps = {
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
};

export default function HotelFlightEditor({
    hotels, flights, cabs, buses, totalDays, currency, onHotelsChange, onFlightsChange, onCabsChange, onBusesChange
}: HotelFlightEditorProps) {
    const TAB_CONFIG = [
        { value: "flights", label: "Flights", count: flights.length, icon: Plane, description: "Manage flight options and itineraries." },
        { value: "hotels", label: "Hotels", count: hotels.length, icon: Hotel, description: "Manage accommodation options and stays." },
        { value: "cabs",    label: "Cabs",    count: cabs.length, icon: Car,   description: "Manage cab transfers and routes." },
        { value: "buses",  label: "Buses",   count: buses.length, icon: Bus,   description: "Manage bus travels and timings." },
    ] as const;

    const [selectedEditorTab, setSelectedEditorTab] = useState<string>("flights");
    const [slideDir, setSlideDir] = useState<"left" | "right">("right");
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });
    const firstRender = useRef(true);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const idx = TAB_CONFIG.findIndex(t => t.value === selectedEditorTab);
        const el = tabRefs.current[idx];
        if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
        firstRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEditorTab, flights.length, hotels.length, cabs.length, buses.length]);

    // When clicking an unselected tab: add an item + switch to it.
    // When clicking the already-selected tab: just add another item.
    const handleTabClick = (value: string) => {
        if (value === "hotels") { onHotelsChange([...hotels, emptyHotel(0)]); setSelectedEditorTab("hotels"); }
        else if (value === "flights") { onFlightsChange([...flights, emptyFlight(0)]); setSelectedEditorTab("flights"); }
        else if (value === "cabs") { onCabsChange([...cabs, emptyCab(0)]); setSelectedEditorTab("cabs"); }
        else if (value === "buses") { onBusesChange([...buses, emptyBus(0)]); setSelectedEditorTab("buses"); }
    };

    const handleTabSelect = (value: string) => {
        const oldIdx = TAB_CONFIG.findIndex(t => t.value === selectedEditorTab);
        const newIdx = TAB_CONFIG.findIndex(t => t.value === value);
        setSlideDir(newIdx > oldIdx ? "right" : "left");
        setSelectedEditorTab(value);
    };

    const updateHotel = (id: string, updated: HotelInfo) =>
        onHotelsChange(hotels.map((h) => (h.id === id ? updated : h)));

    // Atomically move a day from whatever hotel owns it to the target hotel
    const claimDay = (targetHotelId: string, dayIdx: number) => {
        onHotelsChange(hotels.map((h) => {
            const days = h.dayIndices?.length ? h.dayIndices : [h.dayIndex];
            if (h.id === targetHotelId) {
                const sorted = [...new Set([...days, dayIdx])].sort((a, b) => a - b);
                return { ...h, dayIndices: sorted, dayIndex: sorted[0], nights: sorted.length };
            } else if (days.includes(dayIdx)) {
                const remaining = days.filter(d => d !== dayIdx);
                if (remaining.length === 0) return h; // can't strip last day — keep as-is
                return { ...h, dayIndices: remaining, dayIndex: remaining[0], nights: remaining.length };
            }
            return h;
        }));
    };

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

    const active = TAB_CONFIG.find(t => t.value === selectedEditorTab)!;
    const Icon = active.icon;

    return (
        <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
            {/* Inject keyframes for directional slide */}
            <style>{`
                @keyframes slideFromRight { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
                @keyframes slideFromLeft  { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
            `}</style>

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
                        {/* Sliding underline indicator */}
                        <div
                            className="absolute bottom-0 h-[2px] rounded-full bg-primary shadow-[0_0_8px_rgba(255,92,51,0.5)]"
                            style={{
                                left: indicator.left,
                                width: indicator.width,
                                transition: firstRender.current ? 'none' : 'left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)',
                            }}
                        />
                    </div>

                    {/* Active section label & Add button */}
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

                        {/* Collapse/Expand Toggle */}
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
                        {selectedEditorTab === "hotels" && hotels.map((hotel) => {
                            const occupiedDays = hotels
                                .filter(h => h.id !== hotel.id)
                                .flatMap(h => h.dayIndices?.length ? h.dayIndices : [h.dayIndex]);
                            return (
                                <HotelCard
                                    key={hotel.id}
                                    hotel={hotel}
                                    totalDays={totalDays}
                                    onChange={(updated) => updateHotel(hotel.id, updated)}
                                    onDelete={() => deleteHotel(hotel.id)}
                                    isCollapsed={isCollapsed}
                                    occupiedDays={occupiedDays}
                                    onClaimDay={(dayIdx) => claimDay(hotel.id, dayIdx)}
                                />
                            );
                        })}

                        {selectedEditorTab === "flights" && flights.map((flight) => (
                            <FlightCard
                                key={flight.id}
                                flight={flight}
                                totalDays={totalDays}
                                onChange={(updated) => updateFlight(flight.id, updated)}
                                onDelete={() => deleteFlight(flight.id)}
                                isCollapsed={isCollapsed}
                            />
                        ))}

                        {selectedEditorTab === "cabs" && cabs.map((cab) => (
                            <CabCard
                                key={cab.id}
                                cab={cab}
                                totalDays={totalDays}
                                onChange={(updated) => updateCab(cab.id, updated)}
                                onDelete={() => deleteCab(cab.id)}
                                isCollapsed={isCollapsed}
                            />
                        ))}

                        {selectedEditorTab === "buses" && buses.map((bus) => (
                            <BusCard
                                key={bus.id}
                                bus={bus}
                                totalDays={totalDays}
                                onChange={(updated) => updateBus(bus.id, updated)}
                                onDelete={() => deleteBus(bus.id)}
                                isCollapsed={isCollapsed}
                            />
                        ))}

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

