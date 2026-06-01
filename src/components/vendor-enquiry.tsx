"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Building2, Car, Compass, FileCheck, Shield, Sparkles, Send,
  Check, AlertCircle, Pencil, RotateCcw,
  Save, Copy
} from "lucide-react";
import UniqueLoading from "./ui/morph-loading";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useReferenceOptions } from "@/hooks/use-reference-options";
import { useClients } from "@/lib/hooks/use-clients";

import { VendorEnquiryInput } from "@/ai/flows/generate-vendor-enquiry";
import { EnquiryType, EnquiryTypeOption, VendorEnquiry as VendorEnquiryType } from "@/types/vendor-enquiry";
import { vendorEnquiryService } from "@/services/itinerary";
import { useVendorEnquiryAi } from "@/hooks/use-vendor-enquiry-ai";
import { FormField } from "@/components/ui/form-field";
import { EnquiryHistory } from "@/components/vendor/EnquiryHistory";
import { validateEmail } from "@/lib/security/input-sanitizer";


const ICON_MAP: Record<string, any> = {
  Building2, Car, Compass, FileCheck, Shield, Sparkles
};

// ── Mailto helper ────────────────────────────────────────────────────────────

function openGmailCompose(to: string, subject: string, body: string) {
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, "_blank");
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function VendorEnquiry() {
  const { userProfile, agencySettings } = useAuth();
  const { toast } = useToast();
  const { options, loading: optionsLoading } = useReferenceOptions();
  const { clients } = useClients();

  const enquiryTypes = useMemo<EnquiryTypeOption[]>(() => {
    const opts = options.filter(opt => opt.scope === 'vendor_enquiry_type' || opt.scope === 'enquiry_type');
    return opts.map(opt => ({
      value: opt.value,
      label: opt.label,
      icon: ICON_MAP[opt.metadata?.icon] || Sparkles,
      color: opt.metadata?.color || "text-purple-400",
      bg: opt.metadata?.bg || "bg-purple-500/10",
      border: opt.metadata?.border || "border-purple-500/20"
    }));
  }, [options]);

  const mealPlans = useMemo(() => {
    const opts = options.filter(opt => opt.scope === 'meal_plan' || opt.scope === 'mealPlan' || opt.scope === 'meal-plan');
    const unique = Array.from(new Map(opts.map(o => [o.value, o])).values());
    return unique.map(opt => ({ value: opt.value, label: opt.label }));
  }, [options]);

  const vehicleTypes = useMemo(() => {
    const opts = options.filter(opt => opt.scope === 'vehicle_type' || opt.scope === 'transport_type' || opt.scope === 'car_type');
    const unique = Array.from(new Map(opts.map(o => [o.value, o])).values());
    return unique.map(opt => ({ value: opt.value, label: opt.label }));
  }, [options]);

  const coverageTypes = useMemo(() => {
    const opts = options.filter(opt => opt.scope === 'insurance_coverage' || opt.scope === 'coverage_type');
    const unique = Array.from(new Map(opts.map(o => [o.value, o])).values());
    return unique.map(opt => ({ value: opt.value, label: opt.label }));
  }, [options]);

  // Form state
  const [enquiryType, setEnquiryType] = useState<EnquiryType>("hotel");
  const [vendorEmail, setVendorEmail] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDates, setTravelDates] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [infants, setInfants] = useState("0");
  const [specialRequests, setSpecialRequests] = useState("");

  // Hotel fields
  const [hotelName, setHotelName] = useState("");
  const [roomType, setRoomType] = useState("");
  const [numberOfRooms, setNumberOfRooms] = useState("1");
  const [mealPlan, setMealPlan] = useState("");

  // Transport fields
  const [vehicleType, setVehicleType] = useState("");
  const [route, setRoute] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");

  // Activity fields
  const [activityName, setActivityName] = useState("");

  // Visa fields
  const [destinationCountry, setDestinationCountry] = useState("");
  const [nationality, setNationality] = useState("");

  // Insurance fields
  const [coverageType, setCoverageType] = useState("");

  // Persistence state
  const [id, setId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "sent">("draft");
  const [pastEnquiries, setPastEnquiries] = useState<VendorEnquiryType[]>([]);
  const [userItineraries, setUserItineraries] = useState<any[]>([]);
  const [isLoadingPast, setIsLoadingPast] = useState(false);

  // AI Hook
  const {
    isGenerating,
    generatedSubject,
    setGeneratedSubject,
    generatedBody,
    setGeneratedBody,
    isEditing,
    setIsEditing,
    copied,
    handleGenerate: generateWithAi,
    handleCopy,
    resetAiState
  } = useVendorEnquiryAi();

  // ── Dynamic State Initialization ──────────────────────────────────────────
  
  useEffect(() => {
    if (!id && mealPlans.length > 0 && !mealPlan) {
      setMealPlan(agencySettings?.default_meal_plan || mealPlans[0].value);
    }
  }, [mealPlans, mealPlan, agencySettings, id]);

  useEffect(() => {
    if (!id && vehicleTypes.length > 0 && !vehicleType) {
      setVehicleType(agencySettings?.default_cab_vehicle_type || vehicleTypes[0].value);
    }
  }, [vehicleTypes, vehicleType, agencySettings, id]);

  useEffect(() => {
    if (!id && coverageTypes.length > 0 && !coverageType) {
      setCoverageType(coverageTypes[0].value);
    }
  }, [coverageTypes, coverageType, id]);

  // Fetch itineraries and past enquiries
  useEffect(() => {
    async function fetchData() {
      if (!userProfile?.id) return;
      
      setIsLoadingPast(true);
      try {
        const [itins, enqs] = await Promise.all([
          vendorEnquiryService.fetchUserItineraries(userProfile.id),
          vendorEnquiryService.fetchPastEnquiries(userProfile.id)
        ]);
        setUserItineraries(itins);
        setPastEnquiries(enqs);
      } catch (err) {
        console.error("Failed to fetch persistence data:", err);
      } finally {
        setIsLoadingPast(false);
      }
    }
    fetchData();
  }, [userProfile?.id]);

  const hasGenerated = generatedSubject.length > 0;
  const activeType = enquiryTypes.find(t => t.value === enquiryType) || enquiryTypes[0];

  // ── Persistence ───────────────────────────────────────────────────────────
  
  const saveEnquiry = useCallback(async (overrides: any = {}) => {
    if (!userProfile?.id) return;

    const payload = {
      destination, travelDates, adults, children, infants, specialRequests,
      hotelName, roomType, numberOfRooms, mealPlan,
      vehicleType, route, pickupLocation,
      activityName, destinationCountry, nationality, coverageType
    };

    const data: Partial<VendorEnquiryType> = {
      id: id || undefined,
      user_id: userProfile.id,
      client_id: clientId,
      itinerary_id: itineraryId,
      enquiry_type: enquiryType,
      vendor_email: vendorEmail,
      payload,
      subject: overrides.subject || generatedSubject,
      body: overrides.body || generatedBody,
      status: overrides.status || status,
      sent_at: overrides.sent_at || (overrides.status === "sent" ? new Date().toISOString() : null),
    };

    try {
      const saved = await vendorEnquiryService.saveEnquiry(data);
      if (id) {
        setPastEnquiries(prev => prev.map(e => e.id === saved.id ? saved : e));
      } else {
        setId(saved.id);
        setPastEnquiries(prev => [saved, ...prev]);
      }
      return saved;
    } catch (err: any) {
      console.error("Failed to save enquiry:", err?.message || err);
      toast({ variant: "destructive", title: "Save Failed" });
    }
  }, [id, userProfile?.id, clientId, itineraryId, enquiryType, vendorEmail, destination, travelDates, adults, children, infants, specialRequests, hotelName, roomType, numberOfRooms, mealPlan, vehicleType, route, pickupLocation, activityName, destinationCountry, nationality, coverageType, generatedSubject, generatedBody, status, toast]);

  const loadEnquiry = useCallback((enq: VendorEnquiryType) => {
    setId(enq.id);
    setClientId(enq.client_id);
    setItineraryId(enq.itinerary_id);
    setEnquiryType(enq.enquiry_type);
    setVendorEmail(enq.vendor_email || "");
    setGeneratedSubject(enq.subject || "");
    setGeneratedBody(enq.body || "");
    setStatus(enq.status);

    const p = enq.payload;
    setDestination(p.destination || "");
    setTravelDates(p.travelDates || "");
    setAdults(p.adults || "2");
    setChildren(p.children || "0");
    setInfants(p.infants || "0");
    setSpecialRequests(p.specialRequests || "");
    setHotelName(p.hotelName || "");
    setRoomType(p.roomType || "");
    setNumberOfRooms(p.numberOfRooms || "1");
    setMealPlan(p.mealPlan || "");
    setVehicleType(p.vehicleType || "");
    setRoute(p.route || "");
    setPickupLocation(p.pickupLocation || "");
    setActivityName(p.activityName || "");
    setDestinationCountry(p.destinationCountry || "");
    setNationality(p.nationality || "");
    setCoverageType(p.coverageType || "");
    
    setIsEditing(false);
  }, [setGeneratedSubject, setGeneratedBody, setIsEditing]);

  const handleDeleteEnquiry = useCallback(async (enqId: string) => {
    try {
      await vendorEnquiryService.deleteEnquiry(enqId);
      setPastEnquiries(prev => prev.filter(e => e.id !== enqId));
      if (id === enqId) handleReset();
      toast({ title: "Enquiry Deleted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  }, [id, toast]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setId(null);
    setClientId(null);
    setItineraryId(null);
    setVendorEmail("");
    setDestination("");
    setTravelDates("");
    setAdults("2");
    setChildren("0");
    setInfants("0");
    setSpecialRequests("");
    setHotelName("");
    setRoomType("");
    setNumberOfRooms("1");
    setMealPlan(agencySettings?.default_meal_plan || "MAP");
    setVehicleType(agencySettings?.default_cab_vehicle_type || "");
    setRoute("");
    setPickupLocation("");
    setActivityName("");
    setDestinationCountry("");
    setNationality("");
    setCoverageType("");
    resetAiState();
    setStatus("draft");
  };

  // ── Generate ──────────────────────────────────────────────────────────────

  // ── Client-side validation ────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!destination.trim()) {
      errors.push('Destination is required.');
    } else if (destination.trim().length > 200) {
      errors.push('Destination is too long (max 200 characters).');
    }

    if (!travelDates.trim()) {
      errors.push('Travel dates are required.');
    } else if (travelDates.trim().length > 100) {
      errors.push('Travel dates are too long (max 100 characters).');
    }

    const adultsNum = parseInt(adults);
    if (isNaN(adultsNum) || adultsNum < 1 || adultsNum > 200) {
      errors.push('Number of adults must be between 1 and 200.');
    }

    if (vendorEmail.trim() && !validateEmail(vendorEmail.trim())) {
      errors.push('Vendor email must be a valid email address.');
    }

    if (specialRequests.trim().length > 500) {
      errors.push('Special requests are too long (max 500 characters).');
    }

    // Type-specific validations
    if (enquiryType === 'hotel') {
      if (hotelName.trim().length > 200) errors.push('Hotel name is too long (max 200 characters).');
      const rooms = parseInt(numberOfRooms);
      if (isNaN(rooms) || rooms < 1 || rooms > 100) errors.push('Number of rooms must be between 1 and 100.');
    }
    if (enquiryType === 'transport') {
      if (route.trim().length > 200) errors.push('Route description is too long (max 200 characters).');
      if (pickupLocation.trim().length > 200) errors.push('Pickup location is too long (max 200 characters).');
    }
    if (enquiryType === 'activities') {
      if (activityName.trim().length > 200) errors.push('Activity name is too long (max 200 characters).');
    }

    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Please fix the following',
        description: errors[0], // Show first error; server will catch any remaining
      });
      return false;
    }
    return true;
  };

  const onGenerate = async () => {
    if (!validateForm()) return;

    const input: VendorEnquiryInput = {
      enquiryType: enquiryType as any,
      agentName: userProfile?.full_name || "Travel Agent",
      agentCompany: userProfile?.company_name || undefined,
      destination: destination.trim(),
      travelDates: travelDates.trim(),
      numberOfAdults: parseInt(adults) || 2,
      numberOfChildren: parseInt(children) || 0,
      numberOfInfants: parseInt(infants) || 0,
      specialRequests: specialRequests.trim() || undefined,
      vendorEmail: vendorEmail.trim() || undefined,
      hotelName: hotelName.trim() || undefined,
      roomType: roomType.trim() || undefined,
      numberOfRooms: parseInt(numberOfRooms) || undefined,
      mealPlan: mealPlan || undefined,
      vehicleType: vehicleType.trim() || undefined,
      route: route.trim() || undefined,
      pickupLocation: pickupLocation.trim() || undefined,
      activityName: activityName.trim() || undefined,
      destinationCountry: destinationCountry.trim() || undefined,
      nationality: nationality.trim() || undefined,
      coverageType: coverageType.trim() || undefined,
    };

    try {
      const result = await generateWithAi(input);
      await saveEnquiry({ subject: result.subject, body: result.body });
    } catch (err) {
      // toast handled in hook
    }
  };


  // ── Send via Gmail ────────────────────────────────────────────────────────

  const handleSendGmail = useCallback(async () => {
    if (!generatedSubject || !generatedBody) return;
    openGmailCompose(vendorEmail, generatedSubject, generatedBody);
    
    // Mark as sent
    await saveEnquiry({ status: "sent", sent_at: new Date().toISOString() });
    setStatus("sent");

    toast({ title: "Opening Gmail", description: "Enquiry marked as sent." });
  }, [vendorEmail, generatedSubject, generatedBody, saveEnquiry, toast]);

  if (optionsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <UniqueLoading variant="morph" size="md" />
      </div>
    );
  }

  if (!activeType) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>No enquiry types found in reference options. Please check reference options in settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enquiry Type Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {enquiryTypes.map(type => {
            const Icon = type.icon;
            const isActive = enquiryType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => { setEnquiryType(type.value); handleReset(); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200
                  ${isActive
                    ? `${type.bg} ${type.border} ${type.color} shadow-lg shadow-${type.color}/5`
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"}`}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
        </div>

        <EnquiryHistory 
          enquiries={pastEnquiries} 
          isLoading={isLoadingPast} 
          onLoad={loadEnquiry} 
          onDelete={handleDeleteEnquiry} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <Card className="glass-card border-white/10 bg-white/[0.02]">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              {React.createElement(activeType.icon, { className: `w-5 h-5 ${activeType.color}` })}
              <CardTitle className="text-lg">{activeType.label} Enquiry</CardTitle>
            </div>
            <CardDescription className="text-gray-500">
              Fill in the details and let AI generate a professional enquiry email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Persistence & Context</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Link to Client</Label>
                  <Select value={clientId || "none"} onValueChange={(v) => setClientId(v === "none" ? null : v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm">
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Client</SelectItem>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Link to Itinerary</Label>
                  <Select value={itineraryId || "none"} onValueChange={(v) => setItineraryId(v === "none" ? null : v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm">
                      <SelectValue placeholder="Select itinerary..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Itinerary</SelectItem>
                      {userItineraries.map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Common Fields */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Trip Details</p>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Destination" value={destination} onChange={setDestination} placeholder="e.g. Manali, Himachal Pradesh" required />
                <FormField label="Travel Dates" value={travelDates} onChange={setTravelDates} placeholder="e.g. 15 Apr - 22 Apr 2026" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Adults" value={adults} onChange={setAdults} type="number" />
                <FormField label="Children" value={children} onChange={setChildren} type="number" />
                <FormField label="Infants" value={infants} onChange={setInfants} type="number" />
              </div>
            </div>

            {/* Type-Specific Fields */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{activeType.label} Details</p>

              {enquiryType === "hotel" && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Hotel Name" value={hotelName} onChange={setHotelName} placeholder="e.g. The Taj Palace" className="col-span-2" />
                  <FormField label="Room Type" value={roomType} onChange={setRoomType} placeholder="e.g. Deluxe, Suite" />
                  <FormField label="No. of Rooms" value={numberOfRooms} onChange={setNumberOfRooms} type="number" />
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Meal Plan</Label>
                    <Select value={mealPlan} onValueChange={setMealPlan}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mealPlans.map(mp => (
                          <SelectItem key={mp.value} value={mp.value}>{mp.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {enquiryType === "transport" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Vehicle Type</Label>
                    <Select value={vehicleType} onValueChange={setVehicleType}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm">
                        <SelectValue placeholder="Select vehicle..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map(vt => (
                          <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormField label="Route" value={route} onChange={setRoute} placeholder="e.g. Delhi → Manali round trip" className="col-span-2" />
                  <FormField label="Pickup Location" value={pickupLocation} onChange={setPickupLocation} placeholder="e.g. IGI Airport T3" className="col-span-2" />
                </div>
              )}

              {enquiryType === "activities" && (
                <FormField label="Activity / Tour Name" value={activityName} onChange={setActivityName} placeholder="e.g. Paragliding in Bir Billing" />
              )}

              {enquiryType === "visa" && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Destination Country" value={destinationCountry} onChange={setDestinationCountry} placeholder="e.g. Thailand" />
                  <FormField label="Nationality" value={nationality} onChange={setNationality} placeholder="e.g. Indian" />
                </div>
              )}

              {enquiryType === "insurance" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Coverage Type</Label>
                  <Select value={coverageType} onValueChange={setCoverageType}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm">
                      <SelectValue placeholder="Select coverage..." />
                    </SelectTrigger>
                    <SelectContent>
                      {coverageTypes.map(ct => (
                        <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Vendor Email + Special Requests */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <FormField label="Vendor Email" value={vendorEmail} onChange={setVendorEmail} placeholder="e.g. reservations@tajhotels.com" />
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Special Requests</Label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requirements, preferences, or notes..."
                  className="w-full h-20 rounded-md bg-white/5 border border-white/10 text-white text-sm p-3 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  saveEnquiry();
                  toast({ title: "Draft Saved", description: "Your enquiry details have been persisted." });
                }}
                variant="outline"
                className="flex-1 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white h-11 text-sm font-semibold gap-2"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
              <Button
                onClick={onGenerate}
                disabled={isGenerating || !destination.trim() || !travelDates.trim()}
                className="flex-[2] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11 text-sm font-semibold gap-2 shadow-lg shadow-purple-500/20"
              >
                {isGenerating ? (
                  <>
                    <UniqueLoading variant="morph" size="sm" className="w-5 h-5" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {hasGenerated ? "Regenerate" : "Generate with AI"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Email Preview */}
        <div className="space-y-4">
          {!hasGenerated && !isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white/[0.02] border border-white/10 rounded-xl p-8">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">AI Email Preview</h3>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                Fill in the enquiry details and click "Generate Email" to see a professionally crafted enquiry email.
              </p>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white/[0.02] border border-white/10 rounded-xl p-8">
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-purple-500/20 rounded-full blur-xl opacity-50 animate-pulse" />
                <UniqueLoading variant="morph" size="md" className="relative z-10" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Generating Email...</h3>
              <p className="text-sm text-gray-500 text-center">AI is crafting a professional enquiry email for you.</p>
            </div>
          ) : (
            <Card className="glass-card border-white/10 bg-white/[0.02]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Send className="w-5 h-5 text-purple-400" />
                    Email Preview
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={() => setIsEditing(!isEditing)}
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={handleCopy}
                      title="Copy"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={handleReset}
                      title="Reset"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* TO field */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 font-medium w-16">To:</span>
                  <span className="text-gray-300">{vendorEmail || <span className="text-gray-600 italic">No vendor email set</span>}</span>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium text-sm">Subject:</span>
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${generatedSubject.length > 90 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                      {generatedSubject.length}/100
                    </Badge>
                  </div>
                  {isEditing ? (
                    <input
                      value={generatedSubject}
                      onChange={(e) => setGeneratedSubject(e.target.value)}
                      className="w-full bg-white/5 border-white/10 text-white text-sm h-9 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      maxLength={100}
                    />
                  ) : (
                    <p className="text-sm font-medium text-white bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                      {generatedSubject}
                    </p>
                  )}
                </div>

                {/* Body */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium text-sm">Body:</span>
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${generatedBody.length > 1400 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                      {generatedBody.length}/1500
                    </Badge>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={generatedBody}
                      onChange={(e) => setGeneratedBody(e.target.value.slice(0, 1500))}
                      className="w-full h-64 rounded-md bg-white/5 border border-white/10 text-white text-sm p-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none font-mono leading-relaxed"
                    />
                  ) : (
                    <div className="bg-white/5 rounded-lg border border-white/5 p-4 max-h-[320px] overflow-y-auto">
                      <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                        {generatedBody}
                      </pre>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSendGmail}
                  disabled={!generatedSubject || !generatedBody}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-sm font-semibold gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Send className="w-4 h-4" />
                  Open in Gmail
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

