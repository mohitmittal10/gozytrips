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
                {flight.pnr && <span style={{ fontSize: '11px', background: styleVariant.accentBadgeBackground, color: styleVariant.accentBadgeColor || accentColor, padding: '2px 6px', borderRadius: '4px' }}>PNR: {flight.pnr}</span>}
            </div>
            <div style={{ fontSize: '12px', color: textColor, marginTop: '2px' }}>
                {flight.departureAirport} → {flight.arrivalAirport}
                {(flight.departure || flight.arrival) && <span style={{ marginLeft: '8px' }}>{flight.departure}{flight.departure && flight.arrival ? ' – ' : ''}{flight.arrival}</span>}
                {flight.terminal && <span style={{ marginLeft: '8px' }}>Terminal {flight.terminal}</span>}
            </div>
        </div>
    </div>
);

export const PdfHotelBlock = ({ hotel, accentColor, textColor, styleVariant }: { hotel: HotelInfo; accentColor: string; textColor: string; styleVariant: PdfLogisticsBlockStyle }) => {
    const hasImages = hotel.imageUrls && hotel.imageUrls.length > 0;
    const isSingleImage = hotel.imageUrls?.length === 1;

    return (
        <div
            style={{
                padding: '16px',
                borderRadius: styleVariant.borderRadius,
                margin: '16px 0',
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
                ...(styleVariant.useGlass ? glassStyles : {}),
                background: styleVariant.cardBackground,
                border: styleVariant.border,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '18px', display: 'block', marginTop: '2px' }}>🏨</span>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold', color: styleVariant.titleColor || accentColor, fontSize: '15px' }}>{hotel.name || 'Hotel'}</span>
                        <span style={{ color: '#f59e0b', fontSize: '13px' }}>{'★'.repeat(hotel.starRating)}{'☆'.repeat(5 - hotel.starRating)}</span>
                        {hotel.bookingRef && <span style={{ fontSize: '11px', background: styleVariant.accentBadgeBackground, color: styleVariant.accentBadgeColor || accentColor, padding: '2px 6px', borderRadius: '4px' }}>Ref: {hotel.bookingRef}</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: textColor, marginTop: '4px' }}>
                        {hotel.address && <span style={{ marginRight: '4px' }}>{hotel.address} •</span>}
                        <span>Check-in: {hotel.checkIn} • Check-out: {hotel.checkOut}</span>
                    </div>
                </div>
            </div>
            {hasImages && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                    {hotel.imageUrls!.map((url, idx) => (
                        <div
                            key={idx}
                            style={{
                                flex: isSingleImage ? '1 1 100%' : '1 1 calc(50% - 4px)',
                                height: isSingleImage ? '240px' : '160px',
                            }}
                        >
                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', display: 'block' }} crossOrigin="anonymous" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
