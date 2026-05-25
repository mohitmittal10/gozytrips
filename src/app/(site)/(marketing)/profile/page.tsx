'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import UniqueLoading from '@/components/ui/morph-loading';
import { UnifiedSettings } from '@/components/settings/unified-settings';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="relative group">
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl opacity-50 animate-pulse" />
          <UniqueLoading variant="morph" size="lg" className="relative z-10" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#050505]">
      <main className="flex-grow container mx-auto px-4 py-20 max-w-5xl">
        <Link href="/my-trips">
          <Button variant="ghost" className="mb-6 gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Trips
          </Button>
        </Link>
        <UnifiedSettings />
      </main>
    </div>
  );
}
