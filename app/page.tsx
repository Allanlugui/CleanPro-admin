'use client';

import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { OperationsKanban } from '@/components/operations/OperationsKanban';
import { ServicesModule } from '@/components/services/ServicesModule';
import { OperationalTeamModule } from '@/components/team/OperationalTeamModule';
import { SupportHub } from '@/components/support/SupportHub';
import { ReportsModule } from '@/components/analytics/ReportsModule';
import { SqlSchemaViewer } from '@/components/schema/SqlSchemaViewer';
import { LoginView } from '@/components/auth/LoginView';
import { Loader2 } from 'lucide-react';

function DashboardContent() {
  const { activeTab, isAuthenticated, login, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs text-slate-400 font-medium">Verifying CleanOps HQ Authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={login} />;
  }

  return (
    <div className="flex h-screen bg-slate-100/60 overflow-hidden font-sans antialiased text-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'operations' && <OperationsKanban />}
          {activeTab === 'services' && <ServicesModule />}
          {activeTab === 'team' && <OperationalTeamModule />}
          {activeTab === 'support' && <SupportHub />}
          {activeTab === 'analytics' && <ReportsModule />}
          {activeTab === 'schema' && <SqlSchemaViewer />}
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
