import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { MobileNav } from '../components/common/MobileNav';
import { BreadcrumbItem } from '../types';

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  breadcrumbs?: BreadcrumbItem[];
  activeTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export function AppLayout({
  children,
  pageTitle,
  breadcrumbs,
  activeTab = 'overview',
  onNavigateTab
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeTab}
        onNavigateTab={onNavigateTab}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleMobileNav={() => setMobileNavOpen(true)}
          pageTitle={pageTitle}
          breadcrumbs={breadcrumbs}
        />

        {/* Content Viewport with scrolling and bottom padding for mobile bar */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Nav Drawer & Bar */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        activeTab={activeTab}
        onNavigateTab={(tab) => {
          if (onNavigateTab) onNavigateTab(tab);
          setMobileNavOpen(false);
        }}
      />
    </div>
  );
}
