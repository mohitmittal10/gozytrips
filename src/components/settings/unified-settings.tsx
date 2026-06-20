"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, Settings, DollarSign, Home, Shield, User, Cloud, ShieldCheck, Upload, X, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/audit-logger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFormDraft } from "@/hooks/use-form-draft";
import UniqueLoading from "@/components/ui/morph-loading";
import Link from "next/link";
import BackupSettings from "./backup-settings";
import { validateEmail, validatePhone, validateUrl, validateGST, validateHexColor, sanitizeText } from "@/lib/security/input-sanitizer";


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

export function UnifiedSettings() {
  const { user, userProfile, agencySettings, refreshProfile, refreshSettings, loading } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    full_name: "",
    bio: "",
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
    !loading && user ? "unified_settings" : null,
    {
      profile: {
        full_name: userProfile?.full_name || "",
        bio: userProfile?.bio || "",
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
        full_name: userProfile.full_name || "",
        bio: userProfile.bio || "",
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

  // Sync logo preview from profile
  useEffect(() => {
    setLogoPreview(userProfile?.logo_url || null);
  }, [userProfile?.logo_url]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please upload an image file (PNG, JPG, SVG, etc.).' });
      return;
    }
    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Logo must be under 2MB.' });
      return;
    }

    setLogoUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `${user.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('agency-logos')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('agency-logos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setLogoPreview(publicUrl);
      await refreshProfile();
      toast({ title: 'Logo uploaded', description: 'Your agency logo has been saved.' });
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally {
      setLogoUploading(false);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    }
  };

  const handleLogoRemove = async () => {
    if (!user) return;
    setLogoUploading(true);
    try {
      await supabase.from('user_profiles')
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      setLogoPreview(null);
      await refreshProfile();
      toast({ title: 'Logo removed', description: 'Your agency logo has been cleared.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLogoUploading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <UniqueLoading variant="morph" size="md" />
      </div>
    );
  }

  if (!user) return null;

  const validateSettings = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Profile field validations
    if (!profileData.full_name.trim()) {
      errors.push('Agent name is required.');
    } else if (profileData.full_name.length > 100) {
      errors.push('Agent name is too long (max 100 characters).');
    }
    if (profileData.company_name.length > 100) {
      errors.push('Company name is too long (max 100 characters).');
    }
    if (!validateEmail(profileData.business_email)) {
      errors.push('Business email must be a valid email address.');
    }
    if (!validatePhone(profileData.business_phone)) {
      errors.push('Business phone must be a valid phone number.');
    }
    if (!validateUrl(profileData.website)) {
      errors.push('Website must be a valid URL starting with https://');
    }
    if (!validateHexColor(profileData.brand_color)) {
      errors.push('Brand color must be a valid hex color (e.g. #0066cc).');
    }
    if (profileData.bio.length > 500) {
      errors.push('Bio is too long (max 500 characters).');
    }

    // Agency field validations
    if (!validateGST(agencyData.gst_number)) {
      errors.push('GST number is invalid. Expected format: 29GGGGG1314R9Z6');
    }
    if (agencyData.bank_details.length > 500) {
      errors.push('Bank details are too long (max 500 characters).');
    }
    if (agencyData.terms_conditions.length > 2000) {
      errors.push('Terms & conditions are too long (max 2000 characters).');
    }
    if (agencyData.agent_signature.length > 500) {
      errors.push('Email signature is too long (max 500 characters).');
    }
    if (agencyData.default_markup_value < 0) {
      errors.push('Markup value cannot be negative.');
    }
    if (agencyData.default_tax_percentage < 0 || agencyData.default_tax_percentage > 100) {
      errors.push('Tax percentage must be between 0 and 100.');
    }
    if (agencyData.default_commission_rate < 0 || agencyData.default_commission_rate > 100) {
      errors.push('Commission rate must be between 0 and 100.');
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSave = async () => {
    if (!user) return;

    // â”€â”€ Validate before saving â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { valid, errors } = validateSettings();
    if (!valid) {
      toast({
        variant: 'destructive',
        title: 'Please fix the following errors',
        description: (
          <ul className="mt-1 space-y-0.5 text-xs list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        ) as any,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Sanitize all text fields before writing to DB
      const sanitizedProfile = {
        ...profileData,
        full_name: sanitizeText(profileData.full_name, 100),
        company_name: sanitizeText(profileData.company_name, 100),
        bio: sanitizeText(profileData.bio, 500),
      };
      const sanitizedAgency = {
        ...agencyData,
        gst_number: sanitizeText(agencyData.gst_number, 20).toUpperCase(),
        bank_details: sanitizeText(agencyData.bank_details, 500),
        terms_conditions: sanitizeText(agencyData.terms_conditions, 2000),
        agent_signature: sanitizeText(agencyData.agent_signature, 500),
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          ...sanitizedProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      const { error: agencyError } = await supabase
        .from('agency_settings')
        .upsert({
          user_id: user.id,
          ...sanitizedAgency,
        }, { onConflict: 'user_id' });

      if (agencyError) throw agencyError;

      await Promise.all([refreshProfile(), refreshSettings()]);
      await clearDraft();
      
      logAuditEvent(user.id, 'SETTINGS_UPDATE', 'Unified profile and agency settings updated', {
        entityType: 'settings',
        entityId: user.id,
      });

      toast({ title: "Settings Saved", description: "Your profile and agency preferences have been updated globally." });
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
    <div className="space-y-4 sm:space-y-6 w-full max-w-5xl mx-auto pb-10 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 sm:p-3 bg-white/5 rounded-xl border border-white/10 text-gray-300 flex-shrink-0">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400" style={{ fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)' }}>Profile & Settings</h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">Manage your account, personal profile, and agency defaults.</p>
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

      <Tabs defaultValue="account" className="w-full flex flex-col md:flex-row gap-6">
        <TabsList className="bg-transparent border-none w-full md:w-56 flex flex-row md:flex-col justify-start overflow-x-auto hide-scrollbar space-x-2 md:space-x-0 md:space-y-2 shrink-0 h-auto p-0">
          <TabsTrigger value="account" className="data-[state=active]:bg-white/10 data-[state=active]:text-white justify-start min-h-[44px] text-xs sm:text-sm px-4 rounded-xl border border-transparent data-[state=active]:border-white/10 transition-all">
            <User className="w-4 h-4 mr-2 shrink-0" /> Account
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-white/10 data-[state=active]:text-white justify-start min-h-[44px] text-xs sm:text-sm px-4 rounded-xl border border-transparent data-[state=active]:border-white/10 transition-all">
            <Home className="w-4 h-4 mr-2 text-blue-400 shrink-0" /> Profile & Brand
          </TabsTrigger>
          <TabsTrigger value="financials" className="data-[state=active]:bg-white/10 data-[state=active]:text-white justify-start min-h-[44px] text-xs sm:text-sm px-4 rounded-xl border border-transparent data-[state=active]:border-white/10 transition-all">
            <DollarSign className="w-4 h-4 mr-2 text-emerald-400 shrink-0" /> Costing Defaults
          </TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-white/10 data-[state=active]:text-white justify-start min-h-[44px] text-xs sm:text-sm px-4 rounded-xl border border-transparent data-[state=active]:border-white/10 transition-all">
            <Settings className="w-4 h-4 mr-2 text-orange-400 shrink-0" /> Operations
          </TabsTrigger>
          <TabsTrigger value="legal" className="data-[state=active]:bg-white/10 data-[state=active]:text-white justify-start min-h-[44px] text-xs sm:text-sm px-4 rounded-xl border border-transparent data-[state=active]:border-white/10 transition-all">
            <Shield className="w-4 h-4 mr-2 text-purple-400 shrink-0" /> Legal & Compliance
          </TabsTrigger>
          <TabsTrigger value="data" className="data-[state=active]:bg-white/10 data-[state=active]:text-white justify-start min-h-[44px] text-xs sm:text-sm px-4 rounded-xl border border-transparent data-[state=active]:border-white/10 transition-all">
            <Cloud className="w-4 h-4 mr-2 text-cyan-400 shrink-0" /> Integrations
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 min-w-0">
          {/* Account & Security Tab */}
          <TabsContent value="account" className="m-0 space-y-6">
            <Card className="glass-card border-white/10 bg-white/[0.02]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-300" />
                  <CardTitle className="text-lg">Account Information</CardTitle>
                </div>
                <CardDescription className="text-gray-500">Your Wander Labs account details and subscription.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-3 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Email</Label>
                    <Input type="email" value={user?.email || ''} disabled className="bg-white/5 border-white/10 text-white h-10 text-sm opacity-70" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Member Since</Label>
                    <Input type="text" value={userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : ''} disabled className="bg-white/5 border-white/10 text-white h-10 text-sm opacity-70" />
                  </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Current Subscription Plan</p>
                    <p className="text-xl font-bold capitalize text-amber-300">
                      {(userProfile as any)?.plan_type || 'Starter'}
                    </p>
                  </div>
                  <Link href="/pricing">
                    <Button variant="outline" className="glass-button border-white/10">
                      {(userProfile as any)?.plan_type === 'starter' ? 'Upgrade Plan' : 'Manage Subscription'}
                    </Button>
                  </Link>
                </div>

                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-green-400" />
                    <div>
                      <h4 className="font-medium text-green-100">Security & Privacy</h4>
                      <p className="text-xs text-green-400/80">View encryption status, audit logs, and security settings</p>
                    </div>
                  </div>
                  <Link href="/security">
                    <Button variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300">
                      View Security Center
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile & Brand Tab */}
          <TabsContent value="profile" className="m-0 space-y-6">
            <Card className="glass-card border-white/10 bg-white/[0.02]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-lg">Profile & Branding</CardTitle>
                </div>
                <CardDescription className="text-gray-500">This information appears on your itineraries and client portals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-3 sm:px-6">
                {/* Agency Logo Uploader */}
                <div className="space-y-3">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Agency Logo</Label>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="relative w-20 h-20 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Agency logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-600" />
                      )}
                      {logoUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="logo-upload-input"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                          logoUploading
                            ? 'opacity-50 pointer-events-none bg-white/5 text-gray-400 border border-white/10'
                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        {logoPreview ? 'Replace Logo' : 'Upload Logo'}
                      </label>
                      <input
                        id="logo-upload-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                      />
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={handleLogoRemove}
                          disabled={logoUploading}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 ml-2">
                      <p>Appears on all generated itinerary PDFs.</p>
                      <p className="mt-1">Max 2MB Â· PNG, JPG, SVG, WebP</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Agent Full Name</Label>
                    <Input value={profileData.full_name} onChange={(e) => updateProfile('full_name', e.target.value)} placeholder="Your Name" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Company Name</Label>
                    <Input value={profileData.company_name} onChange={(e) => updateProfile('company_name', e.target.value)} placeholder="Agency Name" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Business Email</Label>
                    <Input type="email" value={profileData.business_email} onChange={(e) => updateProfile('business_email', e.target.value)} placeholder="hello@agency.com" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Business Phone</Label>
                    <Input type="tel" value={profileData.business_phone} onChange={(e) => updateProfile('business_phone', e.target.value)} placeholder="+1 (555) 000-0000" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Website URL</Label>
                    <Input type="url" value={profileData.website} onChange={(e) => updateProfile('website', e.target.value)} placeholder="https://www.youragency.com" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Brand Accent Color (Hex)</Label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Input type="color" value={profileData.brand_color} onChange={(e) => updateProfile('brand_color', e.target.value)} className="h-10 w-16 p-1 bg-white/5 border-white/10 flex-shrink-0 rounded-lg cursor-pointer" />
                      <Input type="text" value={profileData.brand_color} onChange={(e) => updateProfile('brand_color', e.target.value)} className="bg-white/5 border-white/10 text-white flex-1 h-10 text-sm uppercase" maxLength={7} />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Agent Bio / Tagline</Label>
                    <Textarea value={profileData.bio} onChange={(e) => updateProfile('bio', e.target.value)} className="bg-white/5 border-white/10 text-white min-h-[80px] text-sm resize-none" placeholder="Tell us about yourself and your travel interests..." />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Email Signature</Label>
                    <Textarea value={agencyData.agent_signature} onChange={(e) => updateAgency('agent_signature', e.target.value)} className="bg-white/5 border-white/10 text-white min-h-[100px] text-sm font-mono" placeholder="Warm Regards,&#10;Agent Name&#10;Company" />
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials" className="m-0 space-y-6">
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
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 w-full text-sm">
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
                      <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white h-10 text-sm flex-shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="flat">Flat Fee</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" min={0} value={agencyData.default_markup_value} onChange={(e) => updateAgency('default_markup_value', Number(e.target.value))} className="bg-white/5 border-white/10 text-white flex-1 h-10 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Default Tax (%)</Label>
                  <Input type="number" min={0} max={100} value={agencyData.default_tax_percentage} onChange={(e) => updateAgency('default_tax_percentage', Number(e.target.value))} className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Default Commission Rate (%)</Label>
                  <Input type="number" min={0} max={100} value={agencyData.default_commission_rate} onChange={(e) => updateAgency('default_commission_rate', Number(e.target.value))} className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="m-0 space-y-6">
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
                      <Input value={agencyData.default_hotel_check_in} onChange={(e) => updateAgency('default_hotel_check_in', e.target.value)} placeholder="2:00 PM" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Check-out Time</Label>
                      <Input value={agencyData.default_hotel_check_out} onChange={(e) => updateAgency('default_hotel_check_out', e.target.value)} placeholder="11:00 AM" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Star Rating</Label>
                      <Select value={String(agencyData.default_hotel_star_rating)} onValueChange={(v) => updateAgency('default_hotel_star_rating', Number(v))}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
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
                      <Input value={agencyData.default_cab_vehicle_type} onChange={(e) => updateAgency('default_cab_vehicle_type', e.target.value)} placeholder="SUV / Sedan" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Bus Type</Label>
                      <Input value={agencyData.default_bus_type} onChange={(e) => updateAgency('default_bus_type', e.target.value)} placeholder="Volvo AC" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Bus Reporting</Label>
                        <Input value={agencyData.default_bus_reporting_time} onChange={(e) => updateAgency('default_bus_reporting_time', e.target.value)} placeholder="8:30 AM" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Bus Departure</Label>
                        <Input value={agencyData.default_bus_departure_time} onChange={(e) => updateAgency('default_bus_departure_time', e.target.value)} placeholder="9:00 AM" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Other Defaults */}
                  <div className="space-y-4 sm:col-span-2">
                    <h4 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2">Miscellaneous</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Default Meal Plan</Label>
                        <Input value={agencyData.default_meal_plan} onChange={(e) => updateAgency('default_meal_plan', e.target.value)} placeholder="MAP / CP" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Booking Currency</Label>
                        <Select value={agencyData.default_booking_currency} onValueChange={(v) => updateAgency('default_booking_currency', v)}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
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
          <TabsContent value="legal" className="m-0 space-y-6">
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
                  <Input value={agencyData.gst_number} onChange={(e) => updateAgency('gst_number', e.target.value)} placeholder="e.g. 29GGGGG1314R9Z6" className="bg-white/5 border-white/10 text-white text-sm h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Bank Details & UPI</Label>
                  <Textarea value={agencyData.bank_details} onChange={(e) => updateAgency('bank_details', e.target.value)} placeholder="Bank Name: HDFC&#10;Account No: 1234567890&#10;IFSC: HDFC0001234&#10;UPI: your-agency@upi" className="bg-white/5 border-white/10 text-white min-h-[100px] text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Terms & Conditions</Label>
                  <Textarea value={agencyData.terms_conditions} onChange={(e) => updateAgency('terms_conditions', e.target.value)} placeholder="1. 50% advance payment required.&#10;2. Cancellations within 7 days are non-refundable." className="bg-white/5 border-white/10 text-white min-h-[150px] text-sm" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data & Integrations Tab */}
          <TabsContent value="data" className="m-0 space-y-6">
            {user && userProfile && (
              <BackupSettings userId={user.id} userProfile={userProfile} />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

