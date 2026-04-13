'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setAuth, removeAuth } from '@/lib/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Block unverified users — sign them out and send to login
        if (!user.emailVerified) {
          await signOut(auth);
          removeAuth();
          if (pathname !== '/login') {
            router.push('/login');
          }
          setLoading(false);
          return;
        }

        // Verified user — sync local state
        setAuth();
        if (pathname === '/login') {
          router.push('/');
        }
      } else {
        // No user — clear auth and redirect to login
        removeAuth();
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Show loading state while Firebase checks auth
  if (loading) {
    return (
      <div className="grid h-screen w-screen place-items-center bg-[#F5F7FB] dark:bg-[#141318]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
