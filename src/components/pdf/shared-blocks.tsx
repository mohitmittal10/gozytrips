import React from 'react';
import type { HotelInfo, FlightInfo } from '@/components/hotel-flight-editor';
import { glassStyles } from './styles';

export type PdfLogisticsBlockStyle = {
    useGlass?: boolean;
    cardBackground: string;
    border: string;
    borderRadius: string;
    accentBadgeBackground: string;
    accentBadgeColor?: string;
    titleColor?: string;
};

export const PdfFlightBlock = ({ flight, accentColor, textColor, styleVariant }: { flight: FlightInfo; accentColor: string; textColor: string; styleVariant: PdfLogisticsBlockStyle }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            borderRadius: styleVariant.borderRadius,
            margin: '16px 0',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            ...(styleVariant.useGlass ? glassStyles : {}),
            background: styleVariant.cardBackground,
            border: styleVariant.border,
        }}
    >
        <span style={{ fontSize: '18px' }}>✈️</span>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold', color: styleVariant.titleColor || accentColor, fontSize: '13px' }}>{flight.airline} {flight.flightNumber}</span>
                <span style={{ fontSize: '10px', background: flight.flightType === 'connecting' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: flight.flightType === 'connecting' ? '#f59e0b' : '#10b981', padding: '2px 6px', borderRadius: '4px', border: flight.flightType === 'connecting' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(16,185,129,0.2)' }}>
                    {flight.flightType === 'connecting' ? 'Connecting' : 'Direct'}
                </span>
                {flight.pnr && <span style={{ fontSize: '11px', background: styleVariant.accentBadgeBackground, color: styleVariant.accentBadgeColor || accentColor, padding: '2px 6px', borderRadius: '4px' }}>PNR: {flight.pnr}</span>}
            </div>
            <div style={{ fontSize: '12px', color: textColor, marginTop: '2px' }}>
                <span style={{ fontWeight: 600 }}>{flight.flightType === 'connecting' ? 'Leg 1: ' : ''}{flight.departureAirport} → {flight.arrivalAirport}</span>
                {(flight.departure || flight.arrival) && <span style={{ marginLeft: '8px' }}>({flight.departure}{flight.departure && flight.arrival ? ' – ' : ''}{flight.arrival})</span>}
                {flight.terminal && <span style={{ marginLeft: '8px', color: '#64748b' }}>Terminal {flight.terminal}</span>}
            </div>
            {flight.flightType === 'connecting' && flight.connectingDepartureAirport && (
                <div style={{ fontSize: '12px', color: textColor, marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Leg 2: {flight.connectingDepartureAirport} → {flight.connectingArrivalAirport || 'ARR'}</span>
                    {(flight.connectingDeparture || flight.connectingArrival) && <span style={{ marginLeft: '8px' }}>({flight.connectingDeparture}{flight.connectingDeparture && flight.connectingArrival ? ' – ' : ''}{flight.connectingArrival})</span>}
                    {flight.connectingAirline && <span style={{ marginLeft: '8px' }}>{flight.connectingAirline} {flight.connectingFlightNumber}</span>}
                    {flight.connectingTerminal && <span style={{ marginLeft: '8px', color: '#64748b' }}>Terminal {flight.connectingTerminal}</span>}
                    {flight.connectingPnr && <span style={{ marginLeft: '8px', background: styleVariant.accentBadgeBackground, color: styleVariant.accentBadgeColor || accentColor, padding: '1px 4px', borderRadius: '3px', fontSize: '10px' }}>PNR: {flight.connectingPnr}</span>}
                </div>
            )}
            {flight.layover && (
                <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px', fontWeight: 600 }}>
                    Layover: {flight.layover}
                </div>
            )}
        </div>
    </div>
);

export const PdfHotelBlock = ({ hotel, accentColor, textColor, styleVariant }: { hotel: HotelInfo & { stays?: { dayIndex: number; nights: number }[] }; accentColor: string; textColor: string; styleVariant: PdfLogisticsBlockStyle }) => {
    const validImages = hotel.imageUrls ? hotel.imageUrls.filter(url => url && url.trim().length > 0) : [];
    const hasImages = validImages.length > 0;
    const isSingleImage = validImages.length === 1;
    const staysList = hotel.stays || (hotel.dayIndices?.length ? hotel.dayIndices.map(d => ({ dayIndex: d, nights: hotel.nights || 1 })) : [{ dayIndex: hotel.dayIndex, nights: hotel.nights || 1 }]);
    const totalNights = staysList.reduce((sum, s) => sum + s.nights, 0);
    const staysLabel = staysList.map(s => `Day ${s.dayIndex + 1}`).join(', ');

    return (
        <div
            style={{
                borderRadius: styleVariant.borderRadius,
                margin: '16px 0',
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
                ...(styleVariant.useGlass ? glassStyles : {}),
                background: styleVariant.cardBackground,
                border: styleVariant.border,
                borderLeft: !hasImages ? `4px solid ${accentColor}` : styleVariant.border,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
        >
            {hasImages && (
                <div style={{ display: 'flex', width: '100%', height: '180px' }}>
                    {validImages.map((url, idx) => (
                        <div
                            key={idx}
                            style={{
                                flex: isSingleImage ? '1 1 100%' : '1 1 50%',
                                height: '100%',
                            }}
                        >
                            <img src={url} alt={`${hotel.name} - View`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
                        </div>
                    ))}
                </div>
            )}
            
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: styleVariant.titleColor || accentColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {hotel.name || 'Hotel'}
                            <span style={{ fontSize: '14px', letterSpacing: '2px', color: '#f59e0b' }}>{'★'.repeat(hotel.starRating)}{'☆'.repeat(5 - hotel.starRating)}</span>
                        </h4>
                        {hotel.address && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: textColor, opacity: 0.8 }}>
                                📍 {hotel.address}
                            </p>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-block', background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            {staysLabel} · {totalNights} Night{totalNights !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(150,150,150,0.15)' }}>
                    <div style={{ flex: '1 1 auto', minWidth: '120px' }}>
                        <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: textColor, opacity: 0.6 }}>Check-in</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: styleVariant.titleColor || accentColor }}>{hotel.checkIn}</p>
                    </div>
                    <div style={{ flex: '1 1 auto', minWidth: '120px' }}>
                        <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: textColor, opacity: 0.6 }}>Check-out</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: styleVariant.titleColor || accentColor }}>{hotel.checkOut}</p>
                    </div>
                    {hotel.bookingRef && (
                        <div style={{ flex: '1 1 auto', minWidth: '120px' }}>
                            <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: textColor, opacity: 0.6 }}>Booking Ref</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: styleVariant.titleColor || accentColor }}>{hotel.bookingRef}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export type GroupedHotel = HotelInfo & {
    stays: { dayIndex: number; nights: number }[];
};

export function groupHotelsByName(hotels: HotelInfo[]): GroupedHotel[] {
    const groupedMap: { [name: string]: GroupedHotel } = {};

    (hotels || []).forEach((h) => {
        const key = (h.name || "Untitled Hotel").trim().toLowerCase();
        // Expand dayIndices (multi-day hotel selection) into individual stay records
        const days = h.dayIndices?.length ? h.dayIndices : [h.dayIndex];
        const staysForEntry = days.map(d => ({ dayIndex: d, nights: h.nights || 1 }));

        if (!groupedMap[key]) {
            groupedMap[key] = { ...h, stays: staysForEntry };
        } else {
            staysForEntry.forEach(s => {
                if (!groupedMap[key].stays.find(existing => existing.dayIndex === s.dayIndex)) {
                    groupedMap[key].stays.push(s);
                }
            });
            if (h.bookingRef && groupedMap[key].bookingRef !== h.bookingRef) {
                groupedMap[key].bookingRef = groupedMap[key].bookingRef
                    ? `${groupedMap[key].bookingRef}, ${h.bookingRef}`
                    : h.bookingRef;
            }
        }
    });

    Object.values(groupedMap).forEach(g => {
        g.stays.sort((a, b) => a.dayIndex - b.dayIndex);
    });

    return Object.values(groupedMap);
}

export function formatHotelStays(stays: { dayIndex: number; nights: number }[]): string {
    const totalNights = stays.reduce((sum, s) => sum + s.nights, 0);
    const uniqueNights = [...new Set(stays.map(s => s.nights))];
    const nightsPerDay = uniqueNights.length === 1 ? `${uniqueNights[0]}N each` : `${totalNights}N total`;
    const staysLabel = stays.map(s => `Day ${s.dayIndex + 1}`).join(', ');
    return `${staysLabel} (${nightsPerDay})`;
}

