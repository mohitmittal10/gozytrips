// Handles debounced localized reading & writing of itinerary data
import { useState, useEffect, useRef, useCallback } from "react";
import type { LoadedPersistenceData } from "@/types/ai-architect";

export function useItineraryPersistence() {
  const [loadedData, setLoadedData] = useState<LoadedPersistenceData | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  // Load purely on mount
  useEffect(() => {
    let _itinerary = null;
    let _hotels = [];
    let _flights = [];
    let _cabs = [];
    let _buses = [];
    let _pricing = undefined;
    let _optimizationCount = 0;
    let _selectedClientId = "none";
    let _selectedStatus = "draft";
    let _tripMetadata = null;

    try {
      const savedItinerary = localStorage.getItem("travelItinerary");
      if (savedItinerary) {
        const parsed = JSON.parse(savedItinerary);
        if (Array.isArray(parsed)) {
          _itinerary = { title: "Custom Itinerary", description: "Modified itinerary", itinerary: parsed };
        } else {
          _itinerary = parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse travelItinerary", e);
    }

    try { const savedOpt = localStorage.getItem("optimizationCount"); if (savedOpt) _optimizationCount = parseInt(savedOpt, 10); } catch (e) {}
    try { const savedHotels = localStorage.getItem("travelHotels"); if (savedHotels) _hotels = JSON.parse(savedHotels); } catch (e) {}
    try { const savedFlights = localStorage.getItem("travelFlights"); if (savedFlights) _flights = JSON.parse(savedFlights); } catch (e) {}
    try { const savedCabs = localStorage.getItem("travelCabs"); if (savedCabs) _cabs = JSON.parse(savedCabs); } catch (e) {}
    try { const savedBuses = localStorage.getItem("travelBuses"); if (savedBuses) _buses = JSON.parse(savedBuses); } catch (e) {}
    try { const savedPricing = localStorage.getItem("travelPricing"); if (savedPricing) _pricing = JSON.parse(savedPricing); } catch (e) {}
    
    try {
      const savedClientId = localStorage.getItem('draft_client_id');
      if (savedClientId) _selectedClientId = savedClientId;
      const savedStatus = localStorage.getItem('draft_status');
      if (savedStatus) _selectedStatus = savedStatus;
      const savedMetadata = localStorage.getItem('travelMetadata');
      if (savedMetadata) {
        const parsed = JSON.parse(savedMetadata);
        if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
        if (parsed.endDate) parsed.endDate = new Date(parsed.endDate);
        _tripMetadata = parsed;
      }
    } catch (e) {
      console.warn("Failed to parse metadata", e);
    }

    setLoadedData({
      itinerary: _itinerary as any,
      hotels: _hotels as any,
      flights: _flights as any,
      cabs: _cabs as any,
      buses: _buses as any,
      pricing: _pricing as any,
      optimizationCount: _optimizationCount,
      selectedClientId: _selectedClientId,
      selectedStatus: _selectedStatus,
      tripMetadata: _tripMetadata as any,
    });
  }, []);

  const saveAll = useCallback((data: Partial<LoadedPersistenceData>) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      try {
        if (data.itinerary) {
          localStorage.setItem("travelItinerary", JSON.stringify(data.itinerary));
          localStorage.setItem("optimizationCount", (data.optimizationCount || 0).toString());
        } else if (data.itinerary === null) {
          localStorage.removeItem("travelItinerary");
          localStorage.removeItem("optimizationCount");
        }
        
        if (data.tripMetadata) {
          localStorage.setItem("travelMetadata", JSON.stringify(data.tripMetadata));
        } else if (data.tripMetadata === null) {
          localStorage.removeItem("travelMetadata");
        }

        if (data.hotels) localStorage.setItem("travelHotels", JSON.stringify(data.hotels));
        if (data.flights) localStorage.setItem("travelFlights", JSON.stringify(data.flights));
        if (data.cabs) localStorage.setItem("travelCabs", JSON.stringify(data.cabs));
        if (data.buses) localStorage.setItem("travelBuses", JSON.stringify(data.buses));
        
        if (data.pricing) {
          localStorage.setItem("travelPricing", JSON.stringify(data.pricing));
        } else if (data.pricing === null) {
          localStorage.removeItem("travelPricing");
        }

        if (data.selectedClientId && data.selectedClientId !== "none") {
          localStorage.setItem('draft_client_id', data.selectedClientId);
        } else if (data.selectedClientId === "none") {
          localStorage.removeItem('draft_client_id');
        }
        
        if (data.selectedStatus) {
          localStorage.setItem('draft_status', data.selectedStatus);
        }
      } catch (err) {
        console.error("Local storage save failed", err);
      }
    }, 1000);
  }, []);

  return { loadedData, saveAll };
}
