"use client";

import { useState } from "react";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from '@/types/pricing';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Hotel, Plane, Plus, Trash2, Star, ChevronDown, X, Camera, Car, Bus
} from "lucide-react";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ── Types ──────────────────────────────────────────────────────────────────────

export type HotelInfo = {
    id: string;
    dayIndex: number;
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
    id: uid(), dayIndex, nights: 1, name: "", address: "", checkIn: "2:00 PM", checkOut: "11:00 AM", bookingRef: "", starRating: 3,
});

const emptyFlight = (dayIndex: number): FlightInfo => ({
    id: uid(), dayIndex, airline: "", flightNumber: "", departure: "", arrival: "", departureAirport: "", arrivalAirport: "", terminal: "", pnr: "",
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

function HotelCard({ hotel, totalDays, onChange, onDelete }: {
    hotel: HotelInfo; totalDays: number;
    onChange: (updated: HotelInfo) => void; onDelete: () => void;
}) {
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

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Hotel className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-400">Hotel</span>
                    <DaySelect value={hotel.dayIndex} onChange={(v) => update("dayIndex", v)} totalDays={totalDays} />
                    <span className="text-sm text-gray-400 ml-2">for</span>
                    <Input
                        type="number"
                        min={1}
                        value={hotel.nights || 1}
                        onChange={(e) => update("nights", Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 h-8 text-sm text-center px-1"
                    />
                    <span className="text-sm text-gray-400">nights</span>
                </div>
                <div className="flex items-center gap-3">
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

function FlightCard({ flight, totalDays, onChange, onDelete }: {
    flight: FlightInfo; totalDays: number;
    onChange: (updated: FlightInfo) => void; onDelete: () => void;
}) {
    const update = (field: keyof FlightInfo, value: string | number | undefined) =>
        onChange({ ...flight, [field]: value } as any);

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">Flight</span>
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
                <Field label="Terminal" value={flight.terminal} onChange={(v) => update("terminal", v)} placeholder="T3" />
                <Field label="PNR" value={flight.pnr} onChange={(v) => update("pnr", v)} placeholder="ABC123" />
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

function CabCard({ cab, totalDays, onChange, onDelete }: {
    cab: CabInfo; totalDays: number;
    onChange: (updated: CabInfo) => void; onDelete: () => void;
}) {
    const update = (field: keyof CabInfo, value: any) =>
        onChange({ ...cab, [field]: value } as any);

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold text-orange-400">Cab / Taxi</span>
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

function BusCard({ bus, totalDays, onChange, onDelete }: {
    bus: BusInfo; totalDays: number;
    onChange: (updated: BusInfo) => void; onDelete: () => void;
}) {
    const update = (field: keyof BusInfo, value: any) =>
        onChange({ ...bus, [field]: value } as any);

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-400">Tourist Bus</span>
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
    const addHotel = () => onHotelsChange([...hotels, emptyHotel(0)]);
    const addFlight = () => onFlightsChange([...flights, emptyFlight(0)]);
    const addCab = () => onCabsChange([...cabs, emptyCab(0)]);
    const addBus = () => onBusesChange([...buses, emptyBus(0)]);

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

    const itemCount = hotels.length + flights.length + cabs.length + buses.length;

    return (
        <Card className="glass-card the-lab-page-card border-white/5 bg-obsidian-dark/40">
            <CardHeader className="bg-white/5 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-lg font-bold tracking-tight text-white">
                        <div className="flex -space-x-2">
                            <Hotel className="w-5 h-5 text-blue-400 bg-obsidian p-1 rounded-full border border-blue-400/20" />
                            <Plane className="w-5 h-5 text-emerald-400 bg-obsidian p-1 rounded-full border border-emerald-400/20" />
                            <Car className="w-5 h-5 text-orange-400 bg-obsidian p-1 rounded-full border border-orange-400/20" />
                            <Bus className="w-5 h-5 text-yellow-400 bg-obsidian p-1 rounded-full border border-yellow-400/20" />
                        </div>
                        <span>Travel Logistics</span>
                        {itemCount > 0 && (
                            <span className="text-[10px] bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                            </span>
                        )}
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6 bg-transparent">
                {/* Add buttons */}
                <div className="flex flex-wrap gap-2 pb-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addHotel}
                        className="gap-2 text-blue-400 border-blue-400/30 hover:bg-blue-400/10 hover:border-blue-400 transition-all font-semibold"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Hotel
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addFlight}
                        className="gap-2 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10 hover:border-emerald-400 transition-all font-semibold"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Flight
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCab}
                        className="gap-2 text-orange-400 border-orange-400/30 hover:bg-orange-400/10 hover:border-orange-400 transition-all font-semibold"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Cab
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addBus}
                        className="gap-2 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10 hover:border-yellow-400 transition-all font-semibold"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Tourist Bus
                    </Button>
                </div>

                {/* Items */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {hotels.map((hotel) => (
                        <HotelCard
                            key={hotel.id}
                            hotel={hotel}
                            totalDays={totalDays}
                            onChange={(updated) => updateHotel(hotel.id, updated)}
                            onDelete={() => deleteHotel(hotel.id)}
                        />
                    ))}

                    {flights.map((flight) => (
                        <FlightCard
                            key={flight.id}
                            flight={flight}
                            totalDays={totalDays}
                            onChange={(updated) => updateFlight(flight.id, updated)}
                            onDelete={() => deleteFlight(flight.id)}
                        />
                    ))}

                    {cabs.map((cab) => (
                        <CabCard
                            key={cab.id}
                            cab={cab}
                            totalDays={totalDays}
                            onChange={(updated) => updateCab(cab.id, updated)}
                            onDelete={() => deleteCab(cab.id)}
                        />
                    ))}

                    {buses.map((bus) => (
                        <BusCard
                            key={bus.id}
                            bus={bus}
                            totalDays={totalDays}
                            onChange={(updated) => updateBus(bus.id, updated)}
                            onDelete={() => deleteBus(bus.id)}
                        />
                    ))}

                    {itemCount === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02]">
                            <div className="p-3 rounded-full bg-white/5 mb-3">
                                <Car className="w-6 h-6 text-gray-500" />
                            </div>
                            <p className="text-gray-400 font-medium">No logistics added yet</p>
                            <p className="text-gray-500 text-xs mt-1">Click the buttons above to add hotels, flights, cabs, or buses.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

