'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const protectedRoutes = ['/ai-architect', '/my-trips', '/profile'];

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/10 to-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
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
