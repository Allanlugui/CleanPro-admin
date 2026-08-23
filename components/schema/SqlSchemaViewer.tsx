'use client';

import React, { useState } from 'react';
import { SUPABASE_SCHEMA_SQL } from '@/lib/supabase/schema-sql';
import { 
  Database, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  Table, 
  Key, 
  Link2, 
  Layers, 
  Sparkles,
  ExternalLink,
  Code2,
  Terminal
} from 'lucide-react';

export function SqlSchemaViewer() {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'tables' | 'rls'>('sql');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([SUPABASE_SCHEMA_SQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supabase-cleaning-ecosystem-schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tablesMeta = [
    {
      name: 'profiles',
      description: 'Extends Supabase Auth (auth.users) with Role-Based Access Control (RBAC)',
      columns: [
        { name: 'id', type: 'UUID (PK)', desc: 'Foreign key referencing auth.users(id)' },
        { name: 'full_type', type: 'TEXT (CHECK)', desc: "'admin' | 'operational' | 'client'" },
        { name: 'full_name', type: 'TEXT', desc: 'User or corporate account representative name' },
        { name: 'email', type: 'TEXT (UNIQUE)', desc: 'Unique account contact address' },
        { name: 'phone', type: 'TEXT', desc: 'Direct phone / SMS dispatch contact' },
        { name: 'avatar_url', type: 'TEXT', desc: 'Profile image location' },
        { name: 'created_at', type: 'TIMESTAMPTZ', desc: 'Default NOW()' },
      ]
    },
    {
      name: 'services',
      description: 'Cleaning service offerings, pricing calculation models, and category metadata',
      columns: [
        { name: 'id', type: 'UUID (PK)', desc: 'gen_random_uuid()' },
        { name: 'title', type: 'TEXT', desc: 'Display name of the cleaning service' },
        { name: 'description', type: 'TEXT', desc: 'Detailed procedural scope' },
        { name: 'base_price', type: 'NUMERIC(10,2)', desc: 'Base pricing rate per standard job session' },
        { name: 'category', type: 'TEXT (CHECK)', desc: 'Residential, Commercial, Deep Cleaning, etc.' },
        { name: 'duration_minutes', type: 'INTEGER', desc: 'Estimated completion time' },
        { name: 'is_active', type: 'BOOLEAN', desc: 'Active booking flag' },
        { name: 'created_at', type: 'TIMESTAMPTZ', desc: 'Default NOW()' },
      ]
    },
    {
      name: 'service_orders',
      description: 'Field operations, scheduled dispatches, status lifecycle, signatures & photo reports',
      columns: [
        { name: 'id', type: 'UUID (PK)', desc: 'gen_random_uuid()' },
        { name: 'client_id', type: 'UUID (FK)', desc: 'References profiles(id)' },
        { name: 'operational_id', type: 'UUID (FK)', desc: 'References assigned technician in profiles(id)' },
        { name: 'service_id', type: 'UUID (FK)', desc: 'References services(id)' },
        { name: 'status', type: 'TEXT (CHECK)', desc: "'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'" },
        { name: 'scheduled_date', type: 'TIMESTAMPTZ', desc: 'Booking appointment datetime' },
        { name: 'total_price', type: 'NUMERIC(10,2)', desc: 'Final billed amount' },
        { name: 'address', type: 'TEXT', desc: 'Premises location street address' },
        { name: 'client_signature_url', type: 'TEXT', desc: 'Storage proof of client acceptance' },
        { name: 'inspection_photos', type: 'TEXT[]', desc: 'Array of audit photo URLs' },
        { name: 'checklist', type: 'JSONB', desc: 'Dynamic quality checklist tasks with timestamps' },
      ]
    },
    {
      name: 'support_tickets',
      description: 'Customer Support (SAC) and Ombudsman escalation ticketing',
      columns: [
        { name: 'id', type: 'UUID (PK)', desc: 'gen_random_uuid()' },
        { name: 'client_id', type: 'UUID (FK)', desc: 'References customer profiles(id)' },
        { name: 'assigned_to', type: 'UUID (FK)', desc: 'Assigned SAC manager in profiles(id)' },
        { name: 'service_order_id', type: 'UUID (FK)', desc: 'Optional link to related service_order' },
        { name: 'subject', type: 'TEXT', desc: 'Inquiry headline or dispute reason' },
        { name: 'status', type: 'TEXT (CHECK)', desc: "'open' | 'in_progress' | 'resolved' | 'closed'" },
        { name: 'priority', type: 'TEXT (CHECK)', desc: "'low' | 'medium' | 'high' | 'urgent'" },
        { name: 'resolution_notes', type: 'TEXT', desc: 'Ombudsman resolution finding' },
      ]
    },
    {
      name: 'chat_messages',
      description: 'Real-time ticket communication stream with internal staff memo filtering',
      columns: [
        { name: 'id', type: 'UUID (PK)', desc: 'gen_random_uuid()' },
        { name: 'ticket_id', type: 'UUID (FK)', desc: 'References support_tickets(id) on delete cascade' },
        { name: 'sender_id', type: 'UUID (FK)', desc: 'References sender in profiles(id)' },
        { name: 'message', type: 'TEXT', desc: 'Encrypted message body' },
        { name: 'is_internal_note', type: 'BOOLEAN', desc: 'Hidden from client (LGPD/GDPR safe staff memo)' },
        { name: 'created_at', type: 'TIMESTAMPTZ', desc: 'Default NOW()' },
      ]
    }
  ];

  return (
    <div id="schema-viewer-container" className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-600" />
            Supabase Database Schema & Architecture (Phase 1)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Complete PostgreSQL DDL definition script with 5 core tables, automated triggers, and Row Level Security (RLS).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-sql-schema"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium shadow-xs transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}
          </button>

          <button
            id="btn-download-sql-file"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs transition-all"
          >
            <Download className="w-4 h-4" />
            Download .sql
          </button>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('sql')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'sql'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          SQL DDL Script
        </button>

        <button
          onClick={() => setActiveSubTab('tables')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'tables'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Table className="w-4 h-4" />
          Table Schemas ({tablesMeta.length})
        </button>

        <button
          onClick={() => setActiveSubTab('rls')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'rls'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          RLS & Security Policies
        </button>
      </div>

      {/* Tab 1: SQL Code Window */}
      {activeSubTab === 'sql' && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="text-xs font-mono text-slate-400 ml-2">supabase/schema.sql</span>
            </div>

            <button
              onClick={handleCopy}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              {copied ? 'Copied' : 'Copy All'}
            </button>
          </div>

          <div className="p-6 overflow-x-auto max-h-[580px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin">
            <pre>{SUPABASE_SCHEMA_SQL}</pre>
          </div>
        </div>
      )}

      {/* Tab 2: Table Columns Breakdown */}
      {activeSubTab === 'tables' && (
        <div className="space-y-6">
          {tablesMeta.map((tbl) => (
            <div key={tbl.name} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                    <Table className="w-4 h-4 text-cyan-600" />
                    {tbl.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{tbl.description}</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {tbl.columns.length} columns
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 text-slate-400 uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Column Name</th>
                      <th className="px-4 py-2.5">Type & Constraint</th>
                      <th className="px-4 py-2.5">Description & Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tbl.columns.map((col, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono font-medium text-slate-800">
                          {col.name}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-cyan-700 font-medium">
                          {col.type}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {col.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: RLS Security Matrix */}
      {activeSubTab === 'rls' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Role-Based Access Control (RBAC) & Row Level Security (RLS)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Every table enforces granular PostgreSQL Row Level Security to protect client personal data and enforce strict operational boundaries in compliance with LGPD and GDPR standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-2">
              <div className="font-bold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                Admin Role
              </div>
              <ul className="text-xs text-indigo-950 space-y-1.5 list-disc pl-4">
                <li>Full CRUD access to services catalog & pricing models</li>
                <li>Assign and reallocate service orders to field teams</li>
                <li>View and resolve all customer support tickets</li>
                <li>Full auditing of inspection photos & signed acceptance tokens</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2">
              <div className="font-bold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                Operational Field Squad
              </div>
              <ul className="text-xs text-amber-950 space-y-1.5 list-disc pl-4">
                <li>Read-only access to active services catalog</li>
                <li>View assigned service orders for their squad</li>
                <li>Update order checklist items, inspection photos, and status</li>
                <li>Read and post operational notes on relevant tickets</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
              <div className="font-bold text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Client Profile
              </div>
              <ul className="text-xs text-emerald-950 space-y-1.5 list-disc pl-4">
                <li>View active cleaning services and pricing models</li>
                <li>Create and view only their own service orders</li>
                <li>Open SAC / Ombudsman support tickets</li>
                <li>Send messages on own tickets (internal staff memos strictly hidden)</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800">Supabase Execution Instructions:</span>
            <p>
              To apply this schema to your Supabase project, navigate to your <strong>Supabase Dashboard &gt; SQL Editor</strong>, paste the script copied above, and click <strong>Run</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
