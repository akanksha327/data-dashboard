'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  subscribeToAuth,
  getAuthSnapshot,
  getAuthServerSnapshot,
} from '@/lib/auth';
import { useAppStore } from '@/lib/app-store';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopNavbar } from '@/components/dashboard/top-navbar';
import { DashboardPage } from '@/components/dashboard/pages/dashboard-page';
import { UploadPage } from '@/components/dashboard/pages/upload-page';
import { InsightsPage } from '@/components/dashboard/pages/insights-page';
import { VisualizationsPage } from '@/components/dashboard/pages/visualizations-page';
import { SettingsPage } from '@/components/dashboard/pages/settings-page';

const subscribeToHydration = () => () => {};

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  upload: 'Upload Data',
  insights: 'Insights',
  visualizations: 'Visualizations',
  settings: 'Settings',
};

const pageDescriptions: Record<string, string> = {
  dashboard: 'Overview of your data',
  upload: 'Import CSV files',
  insights: 'Query your dataset',
  visualizations: 'Chart gallery',
  settings: 'Preferences',
};

// ── ProtectedRoute Wrapper ──────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const isAuthenticated = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getAuthServerSnapshot
  );

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  // Show loading until auth is verified (prevents flash of dashboard)
  if (!hydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-accent-plum/30 border-t-accent-plum rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

// ── Dashboard Shell ─────────────────────────────────────
function DashboardShell() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activePage, setActivePage } = useAppStore();

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleItemClick = (item: string) => {
    console.log('[DEBUG] Navbar/Sidebar item clicked:', item);
    setActivePage(item);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'upload':
        return <UploadPage />;
      case 'insights':
        return <InsightsPage />;
      case 'visualizations':
        return <VisualizationsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeItem={activePage}
          onItemClick={handleItemClick}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full">
            <Sidebar
              activeItem={activePage}
              onItemClick={(item) => {
                handleItemClick(item);
                setMobileMenuOpen(false);
              }}
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          'min-h-screen flex flex-col',
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'
        )}
      >
        <TopNavbar
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          pageTitle={pageTitles[activePage] || 'Dashboard'}
          pageDescription={pageDescriptions[activePage] || ''}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] mx-auto w-full">
          <div key={activePage}>
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Main Page (Protected) ───────────────────────────────
export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardShell />
    </ProtectedRoute>
  );
}
