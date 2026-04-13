'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  Menu,
  Bell,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  Upload,
  MessageSquareText,
  TrendingUp,
  Eye,
  Activity,
  Sun,
  Moon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/lib/app-store';
import { removeAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export interface TopNavbarProps {
  onMenuToggle: () => void;
  pageTitle?: string;
  pageDescription?: string;
}

export function TopNavbar({ onMenuToggle, pageTitle, pageDescription }: TopNavbarProps) {
  const router = useRouter();
  const {
    setActivePage,
    resetAllData,
    recentActivity,
    dataLoaded,
    isDarkMode,
    toggleDarkMode,
  } = useAppStore();
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [lastSeenNotificationId, setLastSeenNotificationId] = React.useState<string | null>(null);

  const handleLogout = async () => {
    // 1. Sign out from Firebase
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out', e);
    }
    // 2. Clear auth flag from localStorage
    removeAuth();
    // 3. Clear user info
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    // 4. Reset all dashboard data in Zustand
    resetAllData();
    // 5. Redirect to login page
    router.replace('/login');
  };

  React.useEffect(() => {
    if (notificationsOpen && recentActivity[0]?.id) {
      setLastSeenNotificationId(recentActivity[0].id);
    }
  }, [notificationsOpen, recentActivity]);

  const unreadNotifications = React.useMemo(() => {
    if (recentActivity.length === 0) {
      return 0;
    }

    if (!lastSeenNotificationId) {
      return recentActivity.length;
    }

    const lastSeenIndex = recentActivity.findIndex((item) => item.id === lastSeenNotificationId);
    return lastSeenIndex === -1 ? recentActivity.length : lastSeenIndex;
  }, [lastSeenNotificationId, recentActivity]);

  const notificationItems = React.useMemo(
    () =>
      recentActivity.slice(0, 6).map((item) => {
        if (item.type === 'upload') {
          return {
            ...item,
            icon: Upload,
            iconClassName: 'text-accent-purple',
            iconWrapperClassName: 'bg-accent-purple-soft',
            targetPage: 'upload',
          };
        }

        if (item.type === 'query') {
          return {
            ...item,
            icon: MessageSquareText,
            iconClassName: 'text-accent-purple',
            iconWrapperClassName: 'bg-accent-purple-soft',
            targetPage: 'insights',
          };
        }

        if (item.type === 'chart') {
          return {
            ...item,
            icon: Eye,
            iconClassName: 'text-accent-slate',
            iconWrapperClassName: 'bg-accent-slate-light',
            targetPage: 'visualizations',
          };
        }

        return {
          ...item,
          icon: TrendingUp,
          iconClassName: 'text-accent-slate',
          iconWrapperClassName: 'bg-accent-slate-light',
          targetPage: 'insights',
        };
      }),
    [recentActivity]
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </Button>
        <div>
          <h1 className="text-base font-semibold text-foreground">
            {pageTitle || 'AI Data Dashboard'}
          </h1>
          {pageDescription && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              {pageDescription}
            </p>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search bar (desktop) */}
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search..."
            className="h-9 w-56 pl-9 rounded-xl bg-muted/60 border-0 text-sm focus-visible:bg-background focus-visible:border focus-visible:border-border"
          />
        </div>

        <Button
          variant={dataLoaded ? 'default' : 'outline'}
          className={cn(
            'hidden rounded-xl px-3.5 text-sm sm:inline-flex',
            dataLoaded
              ? 'bg-accent-purple text-white hover:bg-accent-purple-hover'
              : 'border-border bg-card text-foreground hover:bg-accent'
          )}
          onClick={() => setActivePage('upload')}
        >
          <Upload className="mr-2 h-4 w-4" />
          {dataLoaded ? 'Upload New Data' : 'Upload Data'}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl sm:hidden"
          onClick={() => setActivePage('upload')}
          aria-label={dataLoaded ? 'Upload new data' : 'Upload data'}
        >
          <Upload className="h-[18px] w-[18px] text-muted-foreground" />
        </Button>


        {/* Notification bell */}
        <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-xl"
              aria-label="Open notifications"
            >
              <Bell className="h-[18px] w-[18px] text-muted-foreground" />
              {unreadNotifications > 0 && (
                <>
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent-purple ring-2 ring-card" />
                  <span className="sr-only">{unreadNotifications} unread notifications</span>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[320px] rounded-xl p-1.5">
            <DropdownMenuLabel className="px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {unreadNotifications > 0
                      ? `${unreadNotifications} unread update${unreadNotifications > 1 ? 's' : ''}`
                      : 'You are all caught up'}
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {notificationItems.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No notifications yet</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Upload a dataset or run a query to see activity here.
                </p>
              </div>
            ) : (
              notificationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <DropdownMenuItem
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg px-3 py-3 cursor-pointer"
                    onClick={() => {
                      setActivePage(item.targetPage);
                      setNotificationsOpen(false);
                    }}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.iconWrapperClassName}`}
                    >
                      <Icon className={`h-4 w-4 ${item.iconClassName}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-foreground">
                        {item.description}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.timestamp}</p>
                    </div>
                  </DropdownMenuItem>
                );
              })
            )}

            {notificationItems.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center rounded-lg px-3 py-2 text-sm font-medium cursor-pointer"
                  onClick={() => {
                    setActivePage('dashboard');
                    setNotificationsOpen(false);
                  }}
                >
                  View dashboard activity
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent cursor-pointer focus:outline-none">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Alex" alt="User" />
                <AvatarFallback className="text-xs font-medium bg-accent-purple-soft text-accent-purple">
                  AK
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground leading-tight">Alex Kim</span>
                <span className="text-[11px] text-muted-foreground leading-tight">Pro Plan</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
            <DropdownMenuLabel className="px-2.5 py-2 sm:hidden">
              <p className="text-sm font-medium">Alex Kim</p>
              <p className="text-xs text-muted-foreground">Pro Plan</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="sm:hidden" />

            {/* Theme Toggle (Mobile or Quick Access) */}
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                toggleDarkMode();
              }}
              className="flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {isDarkMode ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
            </DropdownMenuItem>

            {/* Settings */}
            <DropdownMenuItem
              onClick={() => setActivePage('settings')}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
