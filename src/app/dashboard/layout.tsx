'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  Brain,
  LayoutDashboard,
  Upload,
  Settings2,
  Users,
  Target,
  Sparkles,
  History,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/Toast';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload CSV', href: '/dashboard/upload', icon: Upload },
  { name: 'Draft Philosophy', href: '/dashboard/philosophy', icon: Settings2 },
  { name: 'Draft Board', href: '/dashboard/draft', icon: Target },
  { name: 'Sleepers', href: '/dashboard/sleepers', icon: Sparkles },
  { name: 'Compare', href: '/dashboard/compare', icon: Users },
  { name: 'Draft History', href: '/dashboard/history', icon: History },
  { name: 'Position Scarcity', href: '/dashboard/scarcity', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-dugout-50 dark:bg-dugout-950">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-dugout-900 border-r border-dugout-200 dark:border-dugout-800 transition-transform duration-200 lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b border-dugout-200 dark:border-dugout-800 px-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-diamond-500 to-diamond-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-dugout-900 dark:text-white">Draft IQ</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto lg:hidden text-dugout-500 hover:text-dugout-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      isActive ? 'sidebar-link-active' : 'sidebar-link'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User section */}
            <div className="border-t border-dugout-200 dark:border-dugout-800 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-diamond-100 dark:bg-diamond-900 flex items-center justify-center">
                  <span className="text-sm font-medium text-diamond-700 dark:text-diamond-300">
                    {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dugout-900 dark:text-white truncate">
                    {session?.user?.name || 'User'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="btn-ghost btn-sm flex-1"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="btn-ghost btn-sm flex-1 text-redFlag hover:bg-redFlag/10"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-dugout-200 dark:border-dugout-800 bg-white/80 dark:bg-dugout-900/80 backdrop-blur-sm px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-dugout-500 hover:text-dugout-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex-1" />
            
            {/* Quick actions could go here */}
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
