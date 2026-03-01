'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function ProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [brandColor, setBrandColor] = useState('#0066cc');

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || '');
      setBio(userProfile.bio || '');
      setCompanyName(userProfile.company_name || '');
      setBusinessEmail(userProfile.business_email || '');
      setBusinessPhone(userProfile.business_phone || '');
      setWebsite(userProfile.website || '');
      setBrandColor(userProfile.brand_color || '#0066cc');
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          bio: bio,
          company_name: companyName,
          business_email: businessEmail,
          business_phone: businessPhone,
          website: website,
          brand_color: brandColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      await refreshProfile();
      toast({
        title: 'Success!',
        description: 'Profile updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-20 max-w-2xl">
        <Link href="/my-trips">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Trips
          </Button>
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your personal information and preferences</p>
          </div>

          <Card className="glass-main border-white/10">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your Odyssey Luxe account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="glass-input border-white/10 opacity-70"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Member Since</label>
                <Input
                  type="text"
                  value={userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : ''}
                  disabled
                  className="glass-input border-white/10 opacity-70"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-main border-white/10">
            <CardHeader>
              <CardTitle>Travel Agent Profile</CardTitle>
              <CardDescription>Update your professional branding and contact info for generated itineraries</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name / Agent Name</label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="glass-input border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <Input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Odyssey Luxe Travel"
                      className="glass-input border-white/10"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Email</label>
                    <Input
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="hello@travelagency.com"
                      className="glass-input border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Phone</label>
                    <Input
                      type="tel"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="glass-input border-white/10"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website</label>
                    <Input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.youragency.com"
                      className="glass-input border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Accent Color (Hex)</label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-12 h-10 p-1 bg-transparent border-white/10 cursor-pointer rounded-md"
                      />
                      <Input
                        type="text"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="glass-input border-white/10 uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio / Tagline</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself and your travel interests. This may appear on your itineraries."
                    className="glass-input border-white/10 min-h-20 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 group w-full sm:w-auto mt-4"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
