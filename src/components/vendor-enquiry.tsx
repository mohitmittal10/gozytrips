"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Car, Compass, FileCheck, Shield, Sparkles, Send,
  LoaderCircle, Copy, Check, AlertCircle, Pencil, RotateCcw,
  History, Trash2, ExternalLink, Save
} from "lucide-react";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { generateVendorEnquiry } from "@/ai/flows/generate-vendor-enquiry";
import type { VendorEnquiryInput } from "@/ai/flows/generate-vendor-enquiry";
import { LucideIcon } from "lucide-react";
import { useReferenceOptions } from "@/hooks/use-reference-options";
import { useClients } from "@/lib/hooks/use-clients";

const ICON_MAP: Record<string, LucideIcon> = {
  Building2, Car, Compass, FileCheck, Shield, Sparkles
};

type EnquiryType = string;

// ── Mailto helper ────────────────────────────────────────────────────────────

function openGmailCompose(to: string, subject: string, body: string) {
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, "_blank");
}

// ── Field component ──────────────────────────────────────────────────────────

function FormField({
  label, value, onChange, placeholder, type = "text", required = false, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-purple-500 h-9 text-sm"
      />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function VendorEnquiry() {
  const { userProfile, agencySettings } = useAuth();
  const { toast } = useToast();
  const { options, loading: optionsLoading } = useReferenceOptions();

  const enquiryTypes = useMemo(() => {
    // Support both new 'vendor_enquiry_type' and legacy 'enquiry_type'
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

  // Output state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState("");
  const [generatedBody, setGeneratedBody] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Persistence state
  const [id, setId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "sent">("draft");
  const [pastEnquiries, setPastEnquiries] = useState<any[]>([]);
  const [userItineraries, setUserItineraries] = useState<any[]>([]);
  const [isLoadingPast, setIsLoadingPast] = useState(false);

  const { clients } = useClients();
  const supabase = useMemo(() => createClient(), []);

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
        // Fetch itineraries
        const { data: itins } = await supabase
          .from("itineraries")
          .select("id, title")
          .eq("user_id", userProfile.id)
          .order("updated_at", { ascending: false });
        setUserItineraries(itins || []);

        // Fetch past enquiries
        const { data: enqs } = await supabase
          .from("vendor_enquiries")
          .select("*")
          .eq("user_id", userProfile.id)
          .order("updated_at", { ascending: false });
        setPastEnquiries(enqs || []);
      } catch (err) {
        console.error("Failed to fetch persistence data:", err);
      } finally {
        setIsLoadingPast(false);
      }
    }
    fetchData();
  }, [userProfile?.id, supabase]);

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

    const data = {
      user_id: userProfile.id,
      client_id: clientId,
      itinerary_id: itineraryId,
      enquiry_type: enquiryType,
      vendor_email: vendorEmail,
      payload,
      subject: generatedSubject,
      body: generatedBody,
      status: overrides.status || status,
      sent_at: overrides.sent_at || (overrides.status === "sent" ? new Date().toISOString() : null),
    };

    try {
      if (id) {
        const { data: updated, error } = await supabase
          .from("vendor_enquiries")
          .update(data)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        setPastEnquiries(prev => prev.map(e => e.id === id ? updated : e));
      } else {
        const { data: inserted, error } = await supabase
          .from("vendor_enquiries")
          .insert([data])
          .select()
          .single();
        if (error) throw error;
        setId(inserted.id);
        setPastEnquiries(prev => [inserted, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save enquiry:", err);
    }
  }, [id, userProfile?.id, clientId, itineraryId, enquiryType, vendorEmail, destination, travelDates, adults, children, infants, specialRequests, hotelName, roomType, numberOfRooms, mealPlan, vehicleType, route, pickupLocation, activityName, destinationCountry, nationality, coverageType, generatedSubject, generatedBody, status, supabase]);

  const loadEnquiry = useCallback((enq: any) => {
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
  }, []);

  const handleDeleteEnquiry = useCallback(async (enqId: string) => {
    try {
      const { error } = await supabase.from("vendor_enquiries").delete().eq("id", enqId);
      if (error) throw error;
      setPastEnquiries(prev => prev.filter(e => e.id !== enqId));
      if (id === enqId) handleReset();
      toast({ title: "Enquiry Deleted" });
    } catch (err) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  }, [id, supabase, toast]);

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
    setGeneratedSubject("");
    setGeneratedBody("");
    setStatus("draft");
    setIsEditing(false);
  };

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!destination.trim() || !travelDates.trim()) {
      toast({ variant: "destructive", title: "Missing Info", description: "Please fill in destination and travel dates." });
      return;
    }

    setIsGenerating(true);
    try {
      const input: VendorEnquiryInput = {
        enquiryType,
        agentName: userProfile?.full_name || "Travel Agent",
        agentCompany: userProfile?.company_name || undefined,
        destination: destination.trim(),
        travelDates: travelDates.trim(),
        numberOfAdults: parseInt(adults) || 2,
        numberOfChildren: parseInt(children) || 0,
        numberOfInfants: parseInt(infants) || 0,
        specialRequests: specialRequests.trim() || undefined,
        vendorEmail: vendorEmail.trim() || undefined,
        // Type-specific
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

      const result = await generateVendorEnquiry(input);
      setGeneratedSubject(result.subject);
      setGeneratedBody(result.body);
      setIsEditing(false);

      // Save to DB
      await saveEnquiry({ subject: result.subject, body: result.body });

      toast({ title: "Email Generated!", description: "Review and save or send via Gmail." });
    } catch (err: any) {
      console.error("Vendor enquiry generation failed:", err);
      toast({ variant: "destructive", title: "Generation Failed", description: err.message || "Failed to generate email." });
    } finally {
      setIsGenerating(false);
    }
  }, [enquiryType, destination, travelDates, adults, children, infants, specialRequests, vendorEmail, hotelName, roomType, numberOfRooms, mealPlan, vehicleType, route, pickupLocation, activityName, destinationCountry, nationality, coverageType, userProfile, agencySettings, toast, saveEnquiry]);

  // ── Send via Gmail ────────────────────────────────────────────────────────

  const handleSendGmail = useCallback(async () => {
    if (!generatedSubject || !generatedBody) return;
    openGmailCompose(vendorEmail, generatedSubject, generatedBody);
    
    // Mark as sent
    await saveEnquiry({ status: "sent", sent_at: new Date().toISOString() });
    setStatus("sent");

    toast({ title: "Opening Gmail", description: "Enquiry marked as sent." });
  }, [vendorEmail, generatedSubject, generatedBody, saveEnquiry, toast]);

  // ── Copy to clipboard ─────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    const fullEmail = `Subject: ${generatedSubject}\n\n${generatedBody}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Email copied to clipboard." });
  }, [generatedSubject, generatedBody, toast]);

  if (optionsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoaderCircle className="w-8 h-8 animate-spin text-purple-500" />
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

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="border-white/10 text-gray-400 hover:text-white gap-2 h-10">
              <History className="w-4 h-4" />
              History {pastEnquiries.length > 0 && <Badge variant="secondary" className="ml-1 bg-purple-500/20 text-purple-400 border-none">{pastEnquiries.length}</Badge>}
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-[#0a0a0a] border-white/10 text-white w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Recent Enquiries
              </SheetTitle>
              <SheetDescription className="text-gray-500">
                Audit and resume your past vendor outreach.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)] pr-2">
              {isLoadingPast ? (
                <div className="flex items-center justify-center py-12">
                  <LoaderCircle className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : pastEnquiries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">No past enquiries found.</p>
                </div>
              ) : (
                pastEnquiries.map(enq => (
                  <div key={enq.id} className="group relative bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                          {enq.enquiry_type}
                        </Badge>
                        <Badge variant="outline" className={`capitalize text-[10px] ${enq.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {enq.status}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {new Date(enq.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-200 truncate pr-8">{enq.payload.destination}</h4>
                    <p className="text-xs text-gray-500 truncate mb-3">{enq.subject || "No subject"}</p>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" variant="secondary" 
                        className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white border-none flex-1"
                        onClick={() => loadEnquiry(enq)}
                      >
                        Resume
                      </Button>
                      <Button 
                        size="sm" variant="outline" 
                        className="h-8 w-8 p-0 border-white/10 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => handleDeleteEnquiry(enq.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
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
                onClick={handleGenerate}
                disabled={isGenerating || !destination.trim() || !travelDates.trim()}
                className="flex-[2] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11 text-sm font-semibold gap-2 shadow-lg shadow-purple-500/20"
              >
                {isGenerating ? (
                  <>
                    <LoaderCircle className="w-4 h-4 animate-spin" />
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
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 animate-pulse">
                <Sparkles className="w-7 h-7 text-purple-400 animate-spin" />
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
                    <Input
                      value={generatedSubject}
                      onChange={(e) => setGeneratedSubject(e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-sm"
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

                {/* Warning if no vendor email */}
                {!vendorEmail && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2 border border-amber-400/20">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Add a vendor email address to use the "Send via Gmail" feature.</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSendGmail}
                    disabled={!vendorEmail}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-10 text-sm font-semibold gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send via Gmail
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    variant="outline"
                    className="h-10 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
