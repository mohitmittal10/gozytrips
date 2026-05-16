'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import UniqueLoading from './ui/morph-loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const protectedRoutes = ['/the-lab', '/my-trips', '/profile', '/clients'];

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    if (!loading && !user && isProtectedRoute) {
      router.push(`/auth/login?redirect=${pathname}`);
    }
  }, [user, loading, router, pathname, isProtectedRoute]);

  // Only show the loading state if we are trying to access a protected route
  if (loading && isProtectedRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505]">
        <div className="relative group">
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
          <UniqueLoading variant="morph" size="lg" className="relative z-10" />
        </div>
      </div>
    );
  }

  // If user is not authenticated and trying to access a protected route,
  // return null to prevent flash of content before redirect
  if (!user && isProtectedRoute) {
    return null;
  }

  // On public routes, or when user is authenticated on protected routes, show children
  return <>{children}</>;
}

