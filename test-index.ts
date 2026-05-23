import { PdfDaywiseIndex } from './src/components/pdf/pages';

const mockItinerary = {
    itinerary: [
        {
            day: 1,
            date: "2025-05-24",
            areaFocus: "paris exploration",
            timeline: [
                { time: "09:00 AM", details: "Arrive at CDG" }
            ]
        }
    ]
};

const result = PdfDaywiseIndex({
    itinerary: mockItinerary as any,
    accentColor: "#a855f7",
    theme: "classic"
});

console.log("Result is null?", result === null);
console.log("Result JSX:", JSON.stringify(result, null, 2));
