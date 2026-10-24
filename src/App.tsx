import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { RegisterLembagaPage } from './pages/auth/RegisterLembagaPage';
import { SuperAdminDashboard } from './pages/dashboard/SuperAdminDashboard';
import { AdminLembagaDashboard } from './pages/dashboard/AdminLembagaDashboard';
import { UstazDashboard } from './pages/dashboard/UstazDashboard';
import { WaliDashboard } from './pages/dashboard/WaliDashboard';
import { SantriDashboard } from './pages/dashboard/SantriDashboard';
import { ProfilePage } from './pages/profile/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ROLE_DETAILS } from './lib/constants';

function MainRouter() {
  const { currentPage, activeRole, activeLembaga, isSessionLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Loading state while checking session
  if (isSessionLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-700 tracking-wide">
          Memverifikasi Sesi & Hak Akses...
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">Sistem Hafalan Santri Digital</p>
      </div>
    );
  }

  // If on public auth pages
  if (currentPage === 'login') {
    return <LoginPage />;
  }

  if (currentPage === 'forgot_password') {
    return <ForgotPasswordPage />;
  }

  if (currentPage === 'register_lembaga') {
    return <RegisterLembagaPage />;
  }

  if (currentPage === 'not_found') {
    return <NotFoundPage />;
  }

  // Dashboard & Profile are wrapped in AppLayout
  const roleInfo = ROLE_DETAILS[activeRole];

  // Breadcrumbs based on state
  const institutionName = activeRole === 'super_admin' ? 'Konsol Pusat' : activeLembaga?.nama || 'Pesantren';
  const pageTitle =
    currentPage === 'profile'
      ? 'Profil & Pengaturan Akun'
      : `Dashboard ${roleInfo.label}`;

  const breadcrumbs = [
    { label: 'Sistem Hafalan Santri' },
    { label: institutionName },
    { label: pageTitle }
  ];

  const renderDashboardContent = () => {
    switch (activeRole) {
      case 'super_admin':
        return <SuperAdminDashboard activeTab={activeTab} />;
      case 'admin_lembaga':
        return <AdminLembagaDashboard activeTab={activeTab} />;
      case 'ustaz':
        return <UstazDashboard activeTab={activeTab} />;
      case 'wali':
        return <WaliDashboard activeTab={activeTab} />;
      case 'santri':
        return <SantriDashboard activeTab={activeTab} />;
      default:
        return <AdminLembagaDashboard activeTab={activeTab} />;
    }
  };

  return (
    <AppLayout
      pageTitle={pageTitle}
      breadcrumbs={breadcrumbs}
      activeTab={activeTab}
      onNavigateTab={(tab) => setActiveTab(tab)}
    >
      {currentPage === 'profile' ? <ProfilePage /> : renderDashboardContent()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </ToastProvider>
  );
}
