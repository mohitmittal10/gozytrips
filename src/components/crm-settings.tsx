"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, Settings, DollarSign, Building2, Gavel } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/audit-logger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const currencies = [
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
  const { user, userProfile, agencySettings, refreshProfile, refreshSettings } = useAuth();
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
    default_currency: "USD",
    default_markup_type: "percentage",
    default_markup_value: 0,
    default_tax_percentage: 0,
    gst_number: "",
    bank_details: "",
    terms_conditions: "",
    agent_signature: "",
  });

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
        default_currency: agencySettings.default_currency || "USD",
        default_markup_type: agencySettings.default_markup_type || "percentage",
        default_markup_value: agencySettings.default_markup_value || 0,
        default_tax_percentage: agencySettings.default_tax_percentage || 0,
        gst_number: agencySettings.gst_number || "",
        bank_details: agencySettings.bank_details || "",
        terms_conditions: agencySettings.terms_conditions || "",
        agent_signature: agencySettings.agent_signature || "",
      });
    }
  }, [userProfile, agencySettings]);

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
        });

      if (agencyError) throw agencyError;

      await Promise.all([refreshProfile(), refreshSettings()]);
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
    <div className="space-y-6 max-w-4xl pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-gray-300">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Agency Settings</h2>
            <p className="text-sm text-gray-500">Configure your agency's globally applied details and financials.</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-white text-black hover:bg-gray-200 px-8 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Settings
            </span>
          )}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Agency Profile</TabsTrigger>
          <TabsTrigger value="financials" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Costing Defaults</TabsTrigger>
          <TabsTrigger value="legal" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Legal & Compliance</TabsTrigger>
        </TabsList>
        
        {/* Agency Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="glass-card border-white/10 bg-white/[0.02]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-lg">Company Details</CardTitle>
              </div>
              <CardDescription className="text-gray-500">This information will be displayed on client-facing documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Company Name</Label>
                  <Input value={profileData.company_name} onChange={(e) => updateProfile('company_name', e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Business Email</Label>
                  <Input type="email" value={profileData.business_email} onChange={(e) => updateProfile('business_email', e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Business Phone</Label>
                  <Input type="tel" value={profileData.business_phone} onChange={(e) => updateProfile('business_phone', e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Website URL</Label>
                  <Input type="url" value={profileData.website} onChange={(e) => updateProfile('website', e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Brand Color (Hex)</Label>
                  <div className="flex items-center gap-3">
                    <Input type="color" value={profileData.brand_color} onChange={(e) => updateProfile('brand_color', e.target.value)} className="h-10 w-16 p-1 bg-white/5 border-white/10" />
                    <Input type="text" value={profileData.brand_color} onChange={(e) => updateProfile('brand_color', e.target.value)} className="bg-white/5 border-white/10 text-white flex-1" />
                  </div>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Agent Email Signature</Label>
                  <Textarea value={agencyData.agent_signature} onChange={(e) => updateAgency('agent_signature', e.target.value)} className="bg-white/5 border-white/10 text-white min-h-[100px]" placeholder="Warm Regards,&#10;Agent Name&#10;Company" />
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
            <CardContent className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Default Currency</Label>
                <Select value={agencyData.default_currency} onValueChange={(v) => updateAgency('default_currency', v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
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
                <div className="flex gap-2">
                  <Select value={agencyData.default_markup_type} onValueChange={(v) => updateAgency('default_markup_type', v)}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Fee</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} value={agencyData.default_markup_value} onChange={(e) => updateAgency('default_markup_value', Number(e.target.value))} className="bg-white/5 border-white/10 text-white flex-1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Default Tax (%)</Label>
                <Input type="number" min={0} max={100} value={agencyData.default_tax_percentage} onChange={(e) => updateAgency('default_tax_percentage', Number(e.target.value))} className="bg-white/5 border-white/10 text-white" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal & Compliance Tab */}
        <TabsContent value="legal" className="space-y-6">
          <Card className="glass-card border-white/10 bg-white/[0.02]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-lg">Legal & Payments</CardTitle>
              </div>
              <CardDescription className="text-gray-500">Configure your banking details, tax ID, and terms and conditions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5 max-w-xl">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">GST / Tax ID Number</Label>
                <Input value={agencyData.gst_number} onChange={(e) => updateAgency('gst_number', e.target.value)} placeholder="e.g. 29GGGGG1314R9Z6" className="bg-white/5 border-white/10 text-white text-sm" />
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
      </Tabs>
    </div>
  );
}
