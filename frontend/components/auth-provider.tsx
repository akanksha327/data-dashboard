'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setAuth, removeAuth } from '@/lib/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Sync our local state for instant rendering patches
        setAuth();
        // Redirect away from login if authenticated
        if (pathname === '/login') {
          router.push('/');
        }
      } else {
        // Sync our local state
        removeAuth();
        // Redirect to login if on a protected route
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Optionally show a loading state while Firebase checks auth
  if (loading) {
    return (
      <div className="grid h-screen w-screen place-items-center bg-[#F5F7FB] dark:bg-[#141318]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
