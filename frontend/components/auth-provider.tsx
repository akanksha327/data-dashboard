'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { removeAuth, setAuth } from '@/lib/auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
const PUBLIC_PATHS = new Set(['/login', '/comments']);

function isPublicPath(pathname: string | null) {
  return pathname ? PUBLIC_PATHS.has(pathname) : false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let currentUser = auth.currentUser ?? user;

        if (!currentUser.emailVerified) {
          try {
            await currentUser.reload();
          } catch (error) {
            console.error('Failed to refresh Firebase auth state', error);
          }

          currentUser = auth.currentUser ?? currentUser;
        }

        if (!currentUser.emailVerified) {
          if (isPublicPath(pathname)) {
            removeAuth();
            setStatus('unauthenticated');
          } else {
            try {
              await signOut(auth);
            } finally {
              removeAuth();
              setStatus('unauthenticated');
            }
          }
          return;
        }

        setAuth();
        setStatus('authenticated');
        return;
      }

      removeAuth();
      setStatus('unauthenticated');
    });

    return () => unsubscribe();
  }, [pathname]);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'authenticated' && pathname === '/login') {
      router.replace('/');
      return;
    }

    if (status === 'unauthenticated' && !isPublicPath(pathname)) {
      router.replace('/login');
    }
  }, [pathname, router, status]);

  const shouldBlockRender = useMemo(() => {
    if (status === 'loading') {
      return true;
    }

    if (status === 'authenticated') {
      return pathname === '/login';
    }

    return !isPublicPath(pathname);
  }, [pathname, status]);

  if (shouldBlockRender) {
    return (
      <div className="grid h-screen w-screen place-items-center bg-[#F5F7FB] dark:bg-[#141318]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
