'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types/database';
import { 
  Search, 
  Shield, 
  Wrench, 
  User, 
  Database,
  Radio,
  LogOut,
  RefreshCw
} from 'lucide-react';

export function Header() {
  const { 
    currentUser, 
    currentRole, 
    setRole, 
    searchQuery, 
    setSearchQuery, 
    isLiveSupabase,
    isRealtimeConnected,
    refreshData,
    isLoading,
    activeTab,
    setActiveTab,
    logout
  } = useApp();

  const rolesList: { role: UserRole; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
    { 
      role: 'admin', 
      label: 'Administrator', 
      icon: Shield, 
      desc: 'Full CRUD, team dispatching, schema controls & SAC administration' 
    },
    { 
      role: 'operational', 
      label: 'Operational Field Squad', 
      icon: Wrench, 
      desc: 'Assigned orders, live checklist execution, photo upload & signature verification' 
    },
    { 
      role: 'client', 
      label: 'Client Profile', 
      icon: User, 
      desc: 'View booked services, order status updates & direct SAC ticket creation' 
    },
  ];

  return (
    <header 
      id="app-header"
      className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs"
    >
      {/* Search Input */}
      <div className="flex items-center gap-3 w-80 lg:w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search orders, services, technicians, tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Role Switcher & User Profile Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Refresh Sync Button */}
        <button
          id="btn-refresh-database-sync"
          onClick={() => refreshData()}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          title="Refresh Supabase Data Sync"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-600' : ''}`} />
        </button>

        {/* Real-time Status Badge */}
        <button
          id="btn-header-supabase-status"
          onClick={() => setActiveTab('schema')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            isRealtimeConnected 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : isLiveSupabase
              ? 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
          title="Supabase PostgreSQL Realtime Channel"
        >
          <Radio className={`w-3 h-3 ${isRealtimeConnected ? 'text-emerald-500 animate-pulse' : 'text-cyan-500'}`} />
          <span className="hidden md:inline">Supabase</span>
          <span className="text-[10px] font-mono opacity-80">{isRealtimeConnected ? 'Realtime' : 'Connected'}</span>
        </button>

        {/* RBAC Role Simulator */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <span className="text-[11px] font-semibold text-slate-500 px-2 uppercase tracking-wider hidden lg:inline">
            Role:
          </span>
          <div className="flex items-center gap-1">
            {rolesList.map((r) => {
              const Icon = r.icon;
              const isSelected = currentRole === r.role;
              return (
                <button
                  key={r.role}
                  id={`role-switch-${r.role}`}
                  onClick={() => setRole(r.role)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                  title={r.desc}
                >
                  <Icon className={`w-3.5 h-3.5 ${
                    isSelected 
                      ? r.role === 'admin' ? 'text-cyan-600' : r.role === 'operational' ? 'text-amber-600' : 'text-emerald-600'
                      : 'text-slate-400'
                  }`} />
                  <span className="capitalize hidden sm:inline">{r.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Active User Profile Card */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white overflow-hidden flex items-center justify-center text-xs font-bold shadow-xs">
            {currentUser.full_name.charAt(0)}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-none flex items-center gap-1.5">
              {currentUser.full_name}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 capitalize">
              {currentUser.full_type} • {currentUser.email}
            </div>
          </div>

          <button
            id="btn-header-logout"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
