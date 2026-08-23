'use client';

import React from 'react';
import { useApp, ActiveTab } from '@/context/AppContext';
import { 
  Sparkles, 
  Layers, 
  Kanban, 
  Headphones, 
  FileCheck2, 
  Database, 
  ShieldCheck,
  Building2,
  Users,
  ChevronRight,
  LogOut,
  Radio
} from 'lucide-react';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  description: string;
}

export function Sidebar() {
  const { 
    activeTab, 
    setActiveTab, 
    orders, 
    tickets, 
    services, 
    technicians, 
    isLiveSupabase, 
    isRealtimeConnected,
    currentUser, 
    logout 
  } = useApp();

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const activeTicketsCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  const navItems: NavItem[] = [
    {
      id: 'operations',
      label: 'Operations & Dispatcher',
      icon: Kanban,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} Pending` : undefined,
      description: 'Kanban & field crew assignment',
    },
    {
      id: 'services',
      label: 'Services Management',
      icon: Layers,
      badge: services.length > 0 ? services.length : undefined,
      description: 'Catalog, pricing models & tiers',
    },
    {
      id: 'team',
      label: 'Operational Team (CRUD)',
      icon: Users,
      badge: technicians.length > 0 ? technicians.length : undefined,
      description: 'Field squad accounts & credentials',
    },
    {
      id: 'support',
      label: 'Customer Support Hub',
      icon: Headphones,
      badge: activeTicketsCount > 0 ? activeTicketsCount : undefined,
      description: 'SAC, Ombudsman & real-time chat',
    },
    {
      id: 'analytics',
      label: 'Audits & Field Reports',
      icon: FileCheck2,
      description: 'Checklists, photos & signatures',
    },
    {
      id: 'schema',
      label: 'Supabase SQL Schema',
      icon: Database,
      badge: isLiveSupabase ? 'Live' : 'v1.0',
      description: 'DDL, RLS policies & setup script',
    },
  ];

  return (
    <aside 
      id="app-sidebar"
      className="w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 flex-shrink-0 h-screen sticky top-0"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5">
              CleanOps <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-normal border border-cyan-500/30">HQ</span>
            </h1>
            <p className="text-xs text-slate-400">Cleaning Ecosystem Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        <div className="px-3 pb-2 text-[11px] font-medium tracking-wider text-slate-400 uppercase">
          Administrative Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left text-sm transition-all duration-150 group cursor-pointer ${
                isActive
                  ? 'bg-cyan-600 text-white font-medium shadow-md shadow-cyan-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span 
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-cyan-800 text-cyan-100'
                          : 'bg-slate-800 text-cyan-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        <div className="pt-5 px-3 pb-2 text-[11px] font-medium tracking-wider text-slate-400 uppercase">
          Real-Time Sync & Security
        </div>

        {/* Database Realtime Status Card */}
        <div className="mx-1 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Supabase Real-time
            </span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
              isRealtimeConnected 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`}></span>
              {isRealtimeConnected ? 'Live Sync' : isLiveSupabase ? 'Active' : 'Config Ready'}
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            PostgreSQL tables with reactive subscriptions and strict RBAC security.
          </p>
          <button
            onClick={() => setActiveTab('schema')}
            className="w-full mt-1 text-left text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center justify-between font-medium pt-1 border-t border-slate-700/50 cursor-pointer"
          >
            <span>View SQL Schema & Policies</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Compliance Card */}
        <div className="mx-1 p-3 rounded-lg bg-slate-800/30 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>Strict RBAC (role: admin) enforced</span>
        </div>
      </div>

      {/* User Info & Logout Button */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300 flex-shrink-0">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-medium text-white truncate">{currentUser.full_name}</div>
              <div className="text-[10px] text-cyan-400 font-mono capitalize">{currentUser.full_type}</div>
            </div>
          </div>

          <button
            id="btn-sidebar-logout"
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Sign Out of CleanOps HQ"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
