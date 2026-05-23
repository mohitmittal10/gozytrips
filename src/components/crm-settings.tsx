"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, Settings, DollarSign, Home, Shield } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/audit-logger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFormDraft } from "@/hooks/use-form-draft";
import UniqueLoading from "@/components/ui/morph-loading";

// Fallback defaults if DB is not populated
const DEFAULT_CURRENCIES = [
  { value: "INR", label: "Indian Rupee (INR)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "SGD", label: "Singapore Dollar (SGD)" },
  { value: "AED", label: "UAE Dirham (AED)" },
];

export function CrmSettings() {
  const { user, userProfile, agencySettings, refreshProfile, refreshSettings, loading } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    company_name: "",
    business_email: "",
    business_phone: "",
    website: "",
    brand_color: "#0066cc",
  });
  const [agencyData, setAgencyData] = useState({
    default_currency: "INR",
    default_markup_type: "percentage",
    default_markup_value: 0,
    default_tax_percentage: 0,
    default_commission_rate: 0,
    gst_number: "",
    bank_details: "",
    terms_conditions: "",
    agent_signature: "",
    default_booking_currency: "INR",
    default_hotel_check_in: "2:00 PM",
    default_hotel_check_out: "11:00 AM",
    default_hotel_star_rating: 3,
    default_cab_vehicle_type: "SUV",
    default_bus_type: "Volvo AC",
    default_bus_reporting_time: "8:30 AM",
    default_bus_departure_time: "9:00 AM",
    default_meal_plan: "MAP",
  });

  const { saveDraft, clearDraft } = useFormDraft(
    !loading && user ? "crm_settings" : null,
    {
      profile: {
        company_name: userProfile?.company_name || "",
        business_email: userProfile?.business_email || "",
        business_phone: userProfile?.business_phone || "",
        website: userProfile?.website || "",
        brand_color: userProfile?.brand_color || "#0066cc",
      },
      agency: {
        default_currency: agencySettings?.default_currency || "INR",
        default_markup_type: agencySettings?.default_markup_type || "percentage",
        default_markup_value: agencySettings?.default_markup_value || 0,
        default_tax_percentage: agencySettings?.default_tax_percentage || 0,
        default_commission_rate: (agencySettings as any)?.default_commission_rate || 0,
        gst_number: agencySettings?.gst_number || "",
        bank_details: agencySettings?.bank_details || "",
        terms_conditions: agencySettings?.terms_conditions || "",
        agent_signature: agencySettings?.agent_signature || "",
        default_booking_currency: (agencySettings as any)?.default_booking_currency || "INR",
        default_hotel_check_in: (agencySettings as any)?.default_hotel_check_in || "2:00 PM",
        default_hotel_check_out: (agencySettings as any)?.default_hotel_check_out || "11:00 AM",
        default_hotel_star_rating: (agencySettings as any)?.default_hotel_star_rating || 3,
        default_cab_vehicle_type: (agencySettings as any)?.default_cab_vehicle_type || "SUV",
        default_bus_type: (agencySettings as any)?.default_bus_type || "Volvo AC",
        default_bus_reporting_time: (agencySettings as any)?.default_bus_reporting_time || "8:30 AM",
        default_bus_departure_time: (agencySettings as any)?.default_bus_departure_time || "9:00 AM",
        default_meal_plan: (agencySettings as any)?.default_meal_plan || "MAP",
      }
    },
    (draftData) => {
      if (draftData.profile) setProfileData(prev => ({ ...prev, ...draftData.profile }));
      if (draftData.agency) setAgencyData(prev => ({ ...prev, ...draftData.agency }));
    }
  );

  // Save draft whenever data changes
  useEffect(() => {
    saveDraft({ profile: profileData, agency: agencyData as any });
  }, [profileData, agencyData, saveDraft]);

  const [referenceOptions, setReferenceOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await supabase
        .from('reference_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (data) setReferenceOptions(data);
    };
    fetchOptions();
  }, []);

  const currencies = referenceOptions.length > 0 
    ? referenceOptions.filter(opt => opt.scope === 'currency').map(opt => ({ value: opt.value, label: opt.label }))
    : DEFAULT_CURRENCIES;

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        company_name: userProfile.company_name || "",
        business_email: userProfile.business_email || "",
        business_phone: userProfile.business_phone || "",
        website: userProfile.website || "",
        brand_color: userProfile.brand_color || "#0066cc",
      });
    }
    if (agencySettings) {
      setAgencyData({
        default_currency: agencySettings.default_currency || "INR",
        default_markup_type: agencySettings.default_markup_type || "percentage",
        default_markup_value: agencySettings.default_markup_value || 0,
        default_tax_percentage: agencySettings.default_tax_percentage || 0,
        default_commission_rate: (agencySettings as any).default_commission_rate || 0,
        gst_number: agencySettings.gst_number || "",
        bank_details: agencySettings.bank_details || "",
        terms_conditions: agencySettings.terms_conditions || "",
        agent_signature: agencySettings.agent_signature || "",
        default_booking_currency: (agencySettings as any).default_booking_currency || "INR",
        default_hotel_check_in: (agencySettings as any).default_hotel_check_in || "2:00 PM",
        default_hotel_check_out: (agencySettings as any).default_hotel_check_out || "11:00 AM",
        default_hotel_star_rating: (agencySettings as any).default_hotel_star_rating || 3,
        default_cab_vehicle_type: (agencySettings as any).default_cab_vehicle_type || "SUV",
        default_bus_type: (agencySettings as any).default_bus_type || "Volvo AC",
        default_bus_reporting_time: (agencySettings as any).default_bus_reporting_time || "8:30 AM",
        default_bus_departure_time: (agencySettings as any).default_bus_departure_time || "9:00 AM",
        default_meal_plan: (agencySettings as any).default_meal_plan || "MAP",
      });
    }
  }, [userProfile, agencySettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <UniqueLoading variant="morph" size="md" />
      </div>
    );
  }

  if (!user) return null;

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Update user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      // 2. Update agency_settings
      const { error: agencyError } = await supabase
        .from('agency_settings')
        .upsert({
          user_id: user.id,
          ...agencyData,
        }, { onConflict: 'user_id' });

      if (agencyError) throw agencyError;

      await Promise.all([refreshProfile(), refreshSettings()]);
      await clearDraft();
      logAuditEvent(user.id, 'SETTINGS_UPDATE', 'CRM settings and agency profile updated', {
        entityType: 'settings',
        entityId: user.id,
      });

      toast({ title: "Settings Saved", description: "Your agency preferences have been updated globally." });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Error Saving Settings", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (field: string, value: any) => setProfileData(prev => ({ ...prev, [field]: value }));
  const updateAgency = (field: string, value: any) => setAgencyData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-4xl pb-10 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 sm:p-3 bg-white/5 rounded-xl border border-white/10 text-gray-300 flex-shrink-0">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400" style={{ fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)' }}>Agency Settings</h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">Configure your agency's globally applied details and financials.</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="aurora-gradient text-white px-6 sm:px-8 rounded-lg font-semibold hover:brightness-110 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 border-none w-full sm:w-auto min-h-[44px] flex-shrink-0"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Settings
            </span>
          )}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 mb-4 sm:mb-6 w-full flex overflow-x-auto hide-scrollbar">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-h-[40px] text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">                <Home className="w-5 h-5 text-blue-400" /><span className="hidden sm:inline">Agency </span>Profile</TabsTrigger>
          <TabsTrigger value="financials" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-h-[40px] text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4"><DollarSign className="w-3.5 h-3.5 mr-1.5 sm:hidden flex-shrink-0" /><span className="hidden sm:inline">Costing </span>Defaults</TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-h-[40px] text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4"><Settings className="w-3.5 h-3.5 mr-1.5 sm:hidden flex-shrink-0" />Operations</TabsTrigger>
          <TabsTrigger value="legal" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-h-[40px] text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4"><Shield className="w-3.5 h-3.5 mr-1.5 sm:hidden flex-shrink-0" /><span className="hidden sm:inline">Legal & </span>Compliance</TabsTrigger>
        </TabsList>
        
        {/* Agency Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="glass-card border-white/10 bg-white/[0.02]">
            <CardHeader>
              <div className="flex items-center gap-2">
                                <Home className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-lg">Company Details</CardTitle>
              </div>
              <CardDescription className="text-gray-500">This information will be displayed on client-facing documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Company Name</Label>
                  <Input value={profileData.company_name} onChange={(e) => updateProfile('company_name', e.target.value)} className="bg-white/5 border-white/10 text-white h-10 sm:h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Business Email</Label>
                  <Input type="email" value={profileData.business_email} onChange={(e) => updateProfile('business_email', e.target.value)} className="bg-white/5 border-white/10 text-white h-10 sm:h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Business Phone</Label>
                  <Input type="tel" value={profileData.business_phone} onChange={(e) => updateProfile('business_phone', e.target.value)} className="bg-white/5 border-white/10 text-white h-10 sm:h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Website URL</Label>
                  <Input type="url" value={profileData.website} onChange={(e) => updateProfile('website', e.target.value)} className="bg-white/5 border-white/10 text-white h-10 sm:h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Brand Color (Hex)</Label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Input type="color" value={profileData.brand_color} onChange={(e) => updateProfile('brand_color', e.target.value)} className="h-10 w-12 sm:w-16 p-1 bg-white/5 border-white/10 flex-shrink-0" />
                    <Input type="text" value={profileData.brand_color} onChange={(e) => updateProfile('brand_color', e.target.value)} className="bg-white/5 border-white/10 text-white flex-1 h-10 sm:h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Agent Email Signature</Label>
                  <Textarea value={agencyData.agent_signature} onChange={(e) => updateAgency('agent_signature', e.target.value)} className="bg-white/5 border-white/10 text-white min-h-[100px] text-sm" placeholder="Warm Regards,&#10;Agent Name&#10;Company" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-6">
          <Card className="glass-card border-white/10 bg-white/[0.02]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <CardTitle className="text-lg">Global Costing Rules</CardTitle>
              </div>
              <CardDescription className="text-gray-500">Set the default markup, tax rate, and currency for new itineraries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Default Currency</Label>
                <Select value={agencyData.default_currency} onValueChange={(v) => updateAgency('default_currency', v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 sm:h-9 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Default Markup</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={agencyData.default_markup_type} onValueChange={(v) => updateAgency('default_markup_type', v)}>
                    <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white h-10 sm:h-9 text-sm flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Fee</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} value={agencyData.default_markup_value} onChange={(e) => updateAgency('default_markup_value', Number(e.target.value))} className="bg-white/5 border-white/10 text-white flex-1 h-10 sm:h-9 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Default Tax (%)</Label>
                <Input type="number" min={0} max={100} value={agencyData.default_tax_percentage} onChange={(e) => updateAgency('default_tax_percentage', Number(e.target.value))} className="bg-white/5 border-white/10 text-white h-10 sm:h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Default Commission Rate (%)</Label>
                <Input type="number" min={0} max={100} value={agencyData.default_commission_rate} onChange={(e) => updateAgency('default_commission_rate', Number(e.target.value))} className="bg-white/5 border-white/10 text-white h-10 sm:h-9 text-sm" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <Card className="glass-card border-white/10 bg-white/[0.02]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-400" />
                <CardTitle className="text-lg">Logistics & Operational Defaults</CardTitle>
              </div>
              <CardDescription className="text-gray-500">Set default values for hotels, cabs, and buses to speed up itinerary creation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-3 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Hotel Defaults */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2">Hotel Defaults</h4>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Check-in Time</Label>
                    <Input value={agencyData.default_hotel_check_in} onChange={(e) => updateAgency('default_hotel_check_in', e.target.value)} placeholder="2:00 PM" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Check-out Time</Label>
                    <Input value={agencyData.default_hotel_check_out} onChange={(e) => updateAgency('default_hotel_check_out', e.target.value)} placeholder="11:00 AM" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Star Rating</Label>
                    <Select value={String(agencyData.default_hotel_star_rating)} onValueChange={(v) => updateAgency('default_hotel_star_rating', Number(v))}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(s => (
                          <SelectItem key={s} value={String(s)}>{s} Star</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Transport Defaults */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2">Transport Defaults</h4>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Cab Vehicle Type</Label>
                    <Input value={agencyData.default_cab_vehicle_type} onChange={(e) => updateAgency('default_cab_vehicle_type', e.target.value)} placeholder="SUV / Sedan" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Bus Type</Label>
                    <Input value={agencyData.default_bus_type} onChange={(e) => updateAgency('default_bus_type', e.target.value)} placeholder="Volvo AC" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Bus Reporting</Label>
                      <Input value={agencyData.default_bus_reporting_time} onChange={(e) => updateAgency('default_bus_reporting_time', e.target.value)} placeholder="8:30 AM" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Bus Departure</Label>
                      <Input value={agencyData.default_bus_departure_time} onChange={(e) => updateAgency('default_bus_departure_time', e.target.value)} placeholder="9:00 AM" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                    </div>
                  </div>
                </div>

                {/* Other Defaults */}
                <div className="space-y-4 sm:col-span-2">
                  <h4 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2">Miscellaneous</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Default Meal Plan</Label>
                      <Input value={agencyData.default_meal_plan} onChange={(e) => updateAgency('default_meal_plan', e.target.value)} placeholder="MAP / CP" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Booking Currency</Label>
                      <Select value={agencyData.default_booking_currency} onValueChange={(v) => updateAgency('default_booking_currency', v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal & Compliance Tab */}
        <TabsContent value="legal" className="space-y-6">
          <Card className="glass-card border-white/10 bg-white/[0.02]">
            <CardHeader>
              <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-lg">Legal & Payments</CardTitle>
              </div>
              <CardDescription className="text-gray-500">Configure your banking details, tax ID, and terms and conditions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">GST / Tax ID Number</Label>
                <Input value={agencyData.gst_number} onChange={(e) => updateAgency('gst_number', e.target.value)} placeholder="e.g. 29GGGGG1314R9Z6" className="bg-white/5 border-white/10 text-white text-sm h-10 sm:h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Bank Details & UPI</Label>
                <Textarea value={agencyData.bank_details} onChange={(e) => updateAgency('bank_details', e.target.value)} placeholder="Bank Name: HDFC&#10;Account No: 1234567890&#10;IFSC: HDFC0001234&#10;UPI: your-agency@upi" className="bg-white/5 border-white/10 text-white min-h-[100px] text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Terms & Conditions</Label>
                <Textarea value={agencyData.terms_conditions} onChange={(e) => updateAgency('terms_conditions', e.target.value)} placeholder="1. 50% advance payment required.&#10;2. Cancellations within 7 days are non-refundable." className="bg-white/5 border-white/10 text-white min-h-[120px] sm:min-h-[150px] text-sm" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

