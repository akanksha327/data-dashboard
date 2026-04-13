'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Database,
  Download,
  Bell,
  Shield,
  Moon,
  Sun,
  Globe,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/app-store';

export function SettingsPage() {
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const [notifications, setNotifications] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const {
    dataLoaded,
    uploadedFile,
    setDatasetId,
    setUploadedFile,
    setDataLoaded,
    setChartData,
    setInsights,
    setRawCsvData,
  } = useAppStore();

  const clearData = () => {
    setDatasetId(null);
    setUploadedFile(null);
    setDataLoaded(false);
    setChartData([], [], []);
    setInsights([]);
    setRawCsvData([], []);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="animate-fade-in-up">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your dashboard experience
        </p>
      </div>

      {/* Appearance */}
      <Card className="border-0 shadow-sm animate-fade-in-up animate-delay-100">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-gray-soft">
              <Palette className="h-4 w-4 text-accent-gray" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                </div>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Compact Mode</p>
                  <p className="text-xs text-muted-foreground">Reduce spacing for more content</p>
                </div>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Analysis */}
      <Card className="border-0 shadow-sm animate-fade-in-up animate-delay-200">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-purple-soft">
              <Database className="h-4 w-4 text-accent-purple" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Data & Analysis</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-Analysis</p>
                  <p className="text-xs text-muted-foreground">Automatically generate charts on upload</p>
                </div>
              </div>
              <Switch checked={autoAnalysis} onCheckedChange={setAutoAnalysis} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Export Format</p>
                  <p className="text-xs text-muted-foreground">Default export file format</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl text-xs">
                CSV
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <Separator />

            <div className="rounded-xl bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Clear All Data</p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedFile
                        ? `Currently loaded: ${uploadedFile.name}`
                        : 'No data currently loaded'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs text-accent-red border-accent-red/20 hover:bg-accent-red-light hover:text-accent-red"
                  disabled={!dataLoaded}
                  onClick={clearData}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-0 shadow-sm animate-fade-in-up animate-delay-300">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-purple-soft">
              <Bell className="h-4 w-4 text-accent-purple" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Get notified when analysis completes</p>
              </div>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-0 shadow-sm animate-fade-in-up animate-delay-400">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">DataAI Analyst</p>
              <p className="text-xs text-muted-foreground mt-0.5">Version 1.0.0 · Built with Next.js</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Made with ✨ by Z.ai</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
