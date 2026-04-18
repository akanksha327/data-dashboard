'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/app-store';
import { Sidebar } from '@/components/dashboard/sidebar';
import { TopNavbar } from '@/components/dashboard/top-navbar';
import { DashboardPage } from '@/components/dashboard/pages/dashboard-page';
import { UploadPage } from '@/components/dashboard/pages/upload-page';
import { InsightsPage } from '@/components/dashboard/pages/insights-page';
import { VisualizationsPage } from '@/components/dashboard/pages/visualizations-page';
import { SettingsPage } from '@/components/dashboard/pages/settings-page';

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

function DashboardShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activePage, setActivePage } = useAppStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <div className="hidden lg:block">
        <Sidebar
          activeItem={activePage}
          onItemClick={handleItemClick}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

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
          <div key={activePage}>{renderPage()}</div>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return <DashboardShell />;
}
