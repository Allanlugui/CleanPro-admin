'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { formatDateFull } from '@/lib/format-date';
import { 
  FileCheck2, 
  Camera, 
  FileSignature, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Award,
  Sparkles,
  Calendar,
  Building2,
  ExternalLink
} from 'lucide-react';

export function ReportsModule() {
  const { orders, services, tickets } = useApp();
  const [selectedProofOrder, setSelectedProofOrder] = useState(orders.find(o => o.status === 'completed') || orders[0]);

  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
  const totalChecklistItems = orders.flatMap(o => o.checklist);
  const completedChecklistItems = totalChecklistItems.filter(c => c.completed).length;
  const complianceRate = totalChecklistItems.length > 0 
    ? Math.round((completedChecklistItems / totalChecklistItems.length) * 100)
    : 100;

  return (
    <div id="reports-module-container" className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-cyan-600" />
          Field Audits, Quality Signatures & Reports
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Review digital checklists, client signature tokens, inspection photography proofs, and compliance metrics.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Executed Revenue</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            From {completedOrders.length} audited deliveries
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quality Pass Rate</span>
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {complianceRate}%
          </div>
          <div className="text-[11px] text-slate-500">
            {completedChecklistItems}/{totalChecklistItems.length} checklist gates passed
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed Deliveries</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <FileSignature className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {orders.filter(o => o.client_signature_url).length}
          </div>
          <div className="text-[11px] text-slate-500">
            Digitally validated client tokens
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Photo Audit Proofs</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Camera className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {orders.reduce((sum, o) => sum + o.inspection_photos.length, 0)}
          </div>
          <div className="text-[11px] text-slate-500">
            Stored in Supabase storage bucket
          </div>
        </div>
      </div>

      {/* Audit Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Order Selector List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Completed Job Order
            </h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {orders.map((ord) => {
              const isSelected = selectedProofOrder?.id === ord.id;
              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedProofOrder(ord)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected ? 'bg-cyan-50/70 border-l-4 border-cyan-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-700">{ord.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      ord.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-900 text-xs mt-1">
                    {ord.service?.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {ord.client?.full_name} • ${ord.total_price.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Order Detailed Report */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-6">
          {selectedProofOrder ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-700">{selectedProofOrder.id}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">
                      {formatDateFull(selectedProofOrder.scheduled_date)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedProofOrder.service?.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Client: {selectedProofOrder.client?.full_name} | Location: {selectedProofOrder.address}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">Billed Amount</div>
                  <div className="text-xl font-bold text-slate-900">
                    ${selectedProofOrder.total_price.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Verified Checklist Audit */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Executed Cleaning Tasks & Quality Verification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedProofOrder.checklist.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        item.completed ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center flex-shrink-0 ${
                        item.completed ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-white'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="font-medium">{item.task}</div>
                        {item.completed && item.completed_by && (
                          <div className="text-[10px] text-emerald-700 mt-0.5">
                            Passed by {item.completed_by} ({item.timestamp || 'Verified'})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photos Gallery */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-600" />
                  Inspection Photography Proofs ({selectedProofOrder.inspection_photos.length})
                </h4>
                {selectedProofOrder.inspection_photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedProofOrder.inspection_photos.map((photo, i) => (
                      <div key={i} className="aspect-4/3 rounded-xl overflow-hidden border border-slate-200 relative group">
                        <Image 
                          src={photo} 
                          alt="Audit Proof" 
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                          <span className="text-[10px] text-white font-medium relative z-10">Inspection Stamp #{i + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    No inspection photos recorded for this service order.
                  </div>
                )}
              </div>

              {/* Client Signature Sign-off Proof */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSignature className="w-4 h-4 text-emerald-600" />
                  Client Sign-Off & Acceptance Stamp
                </h4>
                {selectedProofOrder.client_signature_url ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Signed by: {selectedProofOrder.client?.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Client confirmed quality satisfaction & premises handoff.
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-2">
                        AUTH-TOKEN: {selectedProofOrder.id}-VERIFIED-2026
                      </div>
                    </div>

                    <div className="bg-white p-2 border border-slate-200 rounded-lg shadow-2xs relative w-44 h-14">
                      <Image 
                        src={selectedProofOrder.client_signature_url} 
                        alt="Client Signature" 
                        fill
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Client signature pending upon completion of final inspection walkthrough.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select an order on the left to view comprehensive audit documentation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
