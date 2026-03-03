"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Hotel, Plane, Plus, Trash2, Star, ChevronDown,
} from "lucide-react";
import {
    Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
    costAdult?: number;
    costChild?: number;
    costInfant?: number;
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

// ── Helpers ────────────────────────────────────────────────────────────────────

let _idCounter = 0;
const uid = () => `hf-${Date.now()}-${++_idCounter}`;

const emptyHotel = (dayIndex: number): HotelInfo => ({
    id: uid(), dayIndex, name: "", address: "", checkIn: "2:00 PM", checkOut: "11:00 AM", bookingRef: "", starRating: 3,
});

const emptyFlight = (dayIndex: number): FlightInfo => ({
    id: uid(), dayIndex, airline: "", flightNumber: "", departure: "", arrival: "", departureAirport: "", arrivalAirport: "", terminal: "", pnr: "",
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
                className="ai-architect-input h-8 text-sm"
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
            <SelectContent>
                {Array.from({ length: totalDays }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>Day {i + 1}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// ── Hotel Card ─────────────────────────────────────────────────────────────────

function HotelCard({ hotel, totalDays, onChange, onDelete }: {
    hotel: HotelInfo; totalDays: number;
    onChange: (updated: HotelInfo) => void; onDelete: () => void;
}) {
    const update = (field: keyof HotelInfo, value: string | number | undefined) =>
        onChange({ ...hotel, [field]: value } as any);

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Hotel className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-400">Hotel</span>
                    <DaySelect value={hotel.dayIndex} onChange={(v) => update("dayIndex", v)} totalDays={totalDays} />
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
        </div>
    );
}

// ── Flight Card ────────────────────────────────────────────────────────────────

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

// ── Main Editor ────────────────────────────────────────────────────────────────

export type HotelFlightEditorProps = {
    hotels: HotelInfo[];
    flights: FlightInfo[];
    totalDays: number;
    onHotelsChange: (hotels: HotelInfo[]) => void;
    onFlightsChange: (flights: FlightInfo[]) => void;
};

export default function HotelFlightEditor({
    hotels, flights, totalDays, onHotelsChange, onFlightsChange,
}: HotelFlightEditorProps) {
    const [isOpen, setIsOpen] = useState(hotels.length > 0 || flights.length > 0);

    const addHotel = () => onHotelsChange([...hotels, emptyHotel(0)]);
    const addFlight = () => onFlightsChange([...flights, emptyFlight(0)]);

    const updateHotel = (id: string, updated: HotelInfo) =>
        onHotelsChange(hotels.map((h) => (h.id === id ? updated : h)));
    const updateFlight = (id: string, updated: FlightInfo) =>
        onFlightsChange(flights.map((f) => (f.id === id ? updated : f)));

    const deleteHotel = (id: string) => onHotelsChange(hotels.filter((h) => h.id !== id));
    const deleteFlight = (id: string) => onFlightsChange(flights.filter((f) => f.id !== id));

    const itemCount = hotels.length + flights.length;

    return (
        <Card className="glass-card ai-architect-page-card mb-6">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Hotel className="w-5 h-5 text-blue-400" />
                                <Plane className="w-5 h-5 text-emerald-400" />
                                <span>Hotels & Flights</span>
                                {itemCount > 0 && (
                                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-normal">
                                        {itemCount} {itemCount === 1 ? "item" : "items"}
                                    </span>
                                )}
                            </CardTitle>
                            <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", isOpen && "rotate-180")} />
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                        {/* Add buttons */}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addHotel}
                                className="gap-1.5 text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Hotel
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addFlight}
                                className="gap-1.5 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Flight
                            </Button>
                        </div>

                        {/* Hotels */}
                        {hotels.map((hotel) => (
                            <HotelCard
                                key={hotel.id}
                                hotel={hotel}
                                totalDays={totalDays}
                                onChange={(updated) => updateHotel(hotel.id, updated)}
                                onDelete={() => deleteHotel(hotel.id)}
                            />
                        ))}

                        {/* Flights */}
                        {flights.map((flight) => (
                            <FlightCard
                                key={flight.id}
                                flight={flight}
                                totalDays={totalDays}
                                onChange={(updated) => updateFlight(flight.id, updated)}
                                onDelete={() => deleteFlight(flight.id)}
                            />
                        ))}

                        {itemCount === 0 && (
                            <p className="text-center text-sm text-gray-500 py-4">
                                No hotels or flights added yet. Click the buttons above to add travel details.
                            </p>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
