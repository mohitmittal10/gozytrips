"use client";

import React, { useState, useCallback } from "react";
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
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { generateVendorEnquiry } from "@/ai/flows/generate-vendor-enquiry";
import type { VendorEnquiryInput } from "@/ai/flows/generate-vendor-enquiry";

// ── Enquiry types ────────────────────────────────────────────────────────────

const ENQUIRY_TYPES = [
  { value: "hotel", label: "Hotel", icon: Building2, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { value: "transport", label: "Transport", icon: Car, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { value: "activities", label: "Activities", icon: Compass, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { value: "visa", label: "Visa", icon: FileCheck, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { value: "insurance", label: "Insurance", icon: Shield, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
] as const;

type EnquiryType = typeof ENQUIRY_TYPES[number]["value"];

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
  const [mealPlan, setMealPlan] = useState("MAP");

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

  const hasGenerated = generatedSubject.length > 0;

  const activeType = ENQUIRY_TYPES.find(t => t.value === enquiryType)!;

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

      toast({ title: "Email Generated!", description: "Review and send via Gmail." });
    } catch (err: any) {
      console.error("Vendor enquiry generation failed:", err);
      toast({ variant: "destructive", title: "Generation Failed", description: err.message || "Failed to generate email." });
    } finally {
      setIsGenerating(false);
    }
  }, [enquiryType, destination, travelDates, adults, children, infants, specialRequests, vendorEmail, hotelName, roomType, numberOfRooms, mealPlan, vehicleType, route, pickupLocation, activityName, destinationCountry, nationality, coverageType, userProfile, agencySettings, toast]);

  // ── Send via Gmail ────────────────────────────────────────────────────────

  const handleSendGmail = useCallback(() => {
    if (!generatedSubject || !generatedBody) return;
    openGmailCompose(vendorEmail, generatedSubject, generatedBody);
    toast({ title: "Opening Gmail", description: "Your email has been pre-filled in Gmail." });
  }, [vendorEmail, generatedSubject, generatedBody, toast]);

  // ── Copy to clipboard ─────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    const fullEmail = `Subject: ${generatedSubject}\n\n${generatedBody}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Email copied to clipboard." });
  }, [generatedSubject, generatedBody, toast]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setGeneratedSubject("");
    setGeneratedBody("");
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Enquiry Type Selector */}
      <div className="flex flex-wrap gap-2">
        {ENQUIRY_TYPES.map(type => {
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
            {/* Common Fields */}
            <div className="space-y-3">
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
                        <SelectItem value="EP">EP (Room Only)</SelectItem>
                        <SelectItem value="CP">CP (Breakfast)</SelectItem>
                        <SelectItem value="MAP">MAP (Breakfast + Dinner)</SelectItem>
                        <SelectItem value="AP">AP (All Meals)</SelectItem>
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
                        <SelectItem value="Sedan">Sedan (4 seater)</SelectItem>
                        <SelectItem value="SUV">SUV (6-7 seater)</SelectItem>
                        <SelectItem value="Tempo Traveller">Tempo Traveller (12-16 seater)</SelectItem>
                        <SelectItem value="Mini Bus">Mini Bus (20-25 seater)</SelectItem>
                        <SelectItem value="Bus">Bus (40+ seater)</SelectItem>
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
                      <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="Medical Only">Medical Only</SelectItem>
                      <SelectItem value="Trip Cancellation">Trip Cancellation</SelectItem>
                      <SelectItem value="Adventure Sports">Adventure Sports</SelectItem>
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

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !destination.trim() || !travelDates.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11 text-sm font-semibold gap-2 shadow-lg shadow-purple-500/20"
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Generating Email...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {hasGenerated ? "Regenerate Email" : "Generate Email with AI"}
                </>
              )}
            </Button>
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
