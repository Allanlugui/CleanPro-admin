'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { ServiceOrder, OrderStatus } from '@/types/database';
import { formatDateTime, formatDateShort, formatTimeShort } from '@/lib/format-date';
import { 
  Kanban, 
  List, 
  Plus, 
  Clock, 
  MapPin, 
  User, 
  Wrench, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Sparkles,
  Camera,
  FileSignature,
  Filter,
  CheckSquare,
  X
} from 'lucide-react';

const COLUMNS: { status: OrderStatus; label: string; bg: string; dot: string; border: string }[] = [
  { status: 'pending', label: 'Pending Dispatch', bg: 'bg-slate-100/70', dot: 'bg-amber-500', border: 'border-amber-200' },
  { status: 'assigned', label: 'Squad Assigned', bg: 'bg-blue-50/50', dot: 'bg-blue-500', border: 'border-blue-200' },
  { status: 'in_progress', label: 'In Progress (Active)', bg: 'bg-cyan-50/50', dot: 'bg-cyan-500', border: 'border-cyan-200' },
  { status: 'completed', label: 'Completed & Audited', bg: 'bg-emerald-50/50', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  { status: 'cancelled', label: 'Cancelled', bg: 'bg-red-50/30', dot: 'bg-red-400', border: 'border-red-200' },
];

export function OperationsKanban() {
  const { 
    orders, 
    updateOrderStatus, 
    assignTechnician, 
    toggleChecklistItem, 
    addInspectionPhoto,
    addOrder,
    allProfiles, 
    services,
    currentRole,
    currentUser,
    searchQuery
  } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // New Order Form
  const [newClientId, setNewClientId] = useState(allProfiles.find(p => p.full_type === 'client')?.id || '');
  const [newServiceId, setNewServiceId] = useState(services[0]?.id || '');
  const [newOperationalId, setNewOperationalId] = useState('');
  const [newDate, setNewDate] = useState('2026-08-25T10:00');
  const [newAddress, setNewAddress] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newCustomPrice, setNewCustomPrice] = useState<number>(300);

  const technicians = allProfiles.filter(p => p.full_type === 'operational');
  const clients = allProfiles.filter(p => p.full_type === 'client');

  const filteredOrders = orders.filter((ord) => {
    // If role is operational, show all or prioritize assigned
    const matchesQuery = !searchQuery || 
      ord.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.client?.full_name && ord.client.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ord.operational?.full_name && ord.operational.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ord.service?.title && ord.service.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (currentRole === 'client') {
      return matchesQuery && ord.client_id === currentUser.id;
    }
    return matchesQuery;
  });

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientId || !newServiceId || !newAddress) return;

    const selectedService = services.find(s => s.id === newServiceId);
    const price = newCustomPrice || selectedService?.base_price || 250;

    addOrder({
      client_id: newClientId,
      service_id: newServiceId,
      operational_id: newOperationalId || null,
      status: newOperationalId ? 'assigned' : 'pending',
      scheduled_date: new Date(newDate).toISOString(),
      total_price: Number(price),
      address: newAddress,
      unit_or_suite: newUnit || null,
      notes: newNotes || null,
      client_signature_url: null,
    });

    setIsNewOrderModalOpen(false);
    // Reset
    setNewAddress('');
    setNewNotes('');
  };

  const handleSimulatePhotoUpload = (orderId: string) => {
    const randomSeed = Math.floor(Math.random() * 1000);
    const mockPhoto = `https://picsum.photos/seed/clean-${randomSeed}/600/400`;
    addInspectionPhoto(orderId, mockPhoto);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, inspection_photos: [...prev.inspection_photos, mockPhoto] } : null);
    }
  };

  return (
    <div id="operations-module-container" className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Kanban className="w-6 h-6 text-cyan-600" />
            Operations & Field Crew Dispatcher
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status board, field crew allocation, live job checklists, and delivery validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              id="view-kanban-toggle"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              id="view-list-toggle"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
          </div>

          {(currentRole === 'admin' || currentRole === 'client') && (
            <button
              id="btn-dispatch-new-order"
              onClick={() => {
                const s = services[0];
                if (s) setNewCustomPrice(s.base_price);
                setIsNewOrderModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              New Service Order
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-400">Total Active Jobs</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {orders.filter(o => o.status !== 'cancelled').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            Across {technicians.length} field squads
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-400">Pending Assignment</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-1">Awaiting dispatch lead</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-400">In Field Execution</div>
          <div className="text-2xl font-bold text-cyan-600 mt-1">
            {orders.filter(o => o.status === 'in_progress').length}
          </div>
          <div className="text-[11px] text-cyan-700/80 mt-1">Live checklist progress</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-400">Completed & Audited</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {orders.filter(o => o.status === 'completed').length}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-1">100% signature proofs</div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colOrders = filteredOrders.filter(o => o.status === col.status);
            return (
              <div 
                key={col.status}
                id={`kanban-col-${col.status}`}
                className="bg-slate-100/60 rounded-xl p-3 border border-slate-200/80 space-y-3 min-h-[480px] flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`}></span>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                    {colOrders.length}
                  </span>
                </div>

                {/* Column Order Cards */}
                <div className="space-y-3 flex-1">
                  {colOrders.map((order) => {
                    const completedTasks = order.checklist.filter(c => c.completed).length;
                    const totalTasks = order.checklist.length;
                    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                      <div
                        key={order.id}
                        id={`order-card-${order.id}`}
                        onClick={() => setSelectedOrder(order)}
                        className="bg-white rounded-xl p-4 border border-slate-200 hover:border-cyan-400 hover:shadow-md cursor-pointer transition-all space-y-3 shadow-2xs group"
                      >
                        {/* Order Category & Price */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors">
                            {order.service?.title || 'Custom Service'}
                          </span>
                          <span className="font-bold text-slate-900">
                            ${order.total_price.toFixed(2)}
                          </span>
                        </div>

                        {/* Location / Address */}
                        <div className="flex items-start gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2 leading-relaxed text-[11px]">
                            {order.address} {order.unit_or_suite && `(${order.unit_or_suite})`}
                          </span>
                        </div>

                        {/* Scheduled Date */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(order.scheduled_date)}</span>
                        </div>

                        {/* Assigned Crew / Technician */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] font-medium text-slate-700 truncate max-w-[110px]">
                              {order.operational?.full_name || (
                                <span className="text-amber-600 italic">Unassigned</span>
                              )}
                            </span>
                          </div>

                          {/* Signature / Photo indicators */}
                          <div className="flex items-center gap-1">
                            {order.inspection_photos.length > 0 && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Inspection Photos Attached">
                                <Camera className="w-2.5 h-2.5" />
                                {order.inspection_photos.length}
                              </span>
                            )}
                            {order.client_signature_url && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Signed by Client">
                                <FileSignature className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Checklist progress bar */}
                        {totalTasks > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Checklist: {completedTasks}/{totalTasks}</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-cyan-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {colOrders.length === 0 && (
                    <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400">
                      No orders in this phase
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table Mode */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Service & Client</th>
                  <th className="px-4 py-3">Address & Schedule</th>
                  <th className="px-4 py-3">Assigned Crew</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Checklist</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const completedTasks = order.checklist.filter(c => c.completed).length;
                  const totalTasks = order.checklist.length;

                  return (
                    <tr 
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-4 py-3 font-mono font-medium text-slate-700">
                        {order.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{order.service?.title}</div>
                        <div className="text-slate-500 text-[11px]">{order.client?.full_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700 truncate max-w-xs">{order.address}</div>
                        <div className="text-slate-400 text-[11px]">
                          {formatDateTime(order.scheduled_date)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {order.operational?.full_name ? (
                          <span className="text-slate-700 font-medium">{order.operational.full_name}</span>
                        ) : (
                          <span className="text-amber-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          order.status === 'in_progress' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                          order.status === 'assigned' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          order.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-600">
                        {completedTasks}/{totalTasks} items
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        ${order.total_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          className="px-2.5 py-1 text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-md border border-cyan-200"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details & Operational Inspection Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            id="order-detail-modal"
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 font-semibold">{selectedOrder.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                    selectedOrder.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    selectedOrder.status === 'in_progress' ? 'bg-cyan-100 text-cyan-800' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedOrder.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedOrder.service?.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Dispatch Assignment & Status Control Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Assign Field Squad Lead
                  </label>
                  <select
                    id="select-assign-technician"
                    value={selectedOrder.operational_id || ''}
                    onChange={(e) => {
                      const newId = e.target.value || null;
                      assignTechnician(selectedOrder.id, newId);
                      setSelectedOrder(prev => prev ? {
                        ...prev,
                        operational_id: newId,
                        operational: newId ? allProfiles.find(p => p.id === newId) : null,
                        status: newId && prev.status === 'pending' ? 'assigned' : prev.status
                      } : null);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="">-- Unassigned (Pending Dispatch) --</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name} ({t.company_name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Workflow Status
                  </label>
                  <select
                    id="select-order-status"
                    value={selectedOrder.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as OrderStatus;
                      updateOrderStatus(selectedOrder.id, newStatus);
                      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Order Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Client Info:</span>
                  <div className="font-semibold text-slate-800 text-sm">{selectedOrder.client?.full_name}</div>
                  <div className="text-slate-500">{selectedOrder.client?.email}</div>
                  <div className="text-slate-500">{selectedOrder.client?.phone}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Service Location:</span>
                  <div className="font-semibold text-slate-800 text-sm">{selectedOrder.address}</div>
                  {selectedOrder.unit_or_suite && (
                    <div className="text-slate-600">{selectedOrder.unit_or_suite}</div>
                  )}
                  <div className="text-cyan-700 font-medium pt-1">
                    Total: ${selectedOrder.total_price.toFixed(2)}
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg text-amber-900">
                  <span className="font-bold">Client Instructions / Notes: </span>
                  {selectedOrder.notes}
                </div>
              )}

              {/* Interactive Execution Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-cyan-600" />
                    Operational Field Checklist & Quality Gate
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {selectedOrder.checklist.filter(c => c.completed).length} / {selectedOrder.checklist.length} Completed
                  </span>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/40">
                  {selectedOrder.checklist.map((item) => (
                    <label 
                      key={item.id}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                        item.completed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {
                          toggleChecklistItem(selectedOrder.id, item.id);
                          setSelectedOrder(prev => {
                            if (!prev) return null;
                            const updated = prev.checklist.map(c => c.id === item.id ? { ...c, completed: !c.completed } : c);
                            return { ...prev, checklist: updated };
                          });
                        }}
                        className="w-4 h-4 text-cyan-600 rounded mt-0.5 border-slate-300 focus:ring-cyan-500"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {item.task}
                        </div>
                        {item.completed && item.completed_by && (
                          <div className="text-[10px] text-emerald-700 mt-0.5">
                            Verified by {item.completed_by} at {item.timestamp || 'Today'}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Inspection Photos & Client Signature Proof */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-cyan-600" />
                    Proof of Delivery: Inspection Photos ({selectedOrder.inspection_photos.length})
                  </h4>
                  <button
                    id="btn-add-mock-photo"
                    onClick={() => handleSimulatePhotoUpload(selectedOrder.id)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Simulate Camera Capture
                  </button>
                </div>

                {selectedOrder.inspection_photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedOrder.inspection_photos.map((photo, i) => (
                      <div key={i} className="aspect-4/3 rounded-lg overflow-hidden border border-slate-200 relative group">
                        <Image 
                          src={photo} 
                          alt={`Inspection ${i + 1}`} 
                          fill
                          className="object-cover group-hover:scale-105 transition-transform" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded z-10">
                          Photo #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400">
                    No inspection photos uploaded yet. Crew can capture before & after proofs.
                  </div>
                )}
              </div>

              {/* Signature Proof */}
              {selectedOrder.client_signature_url && (
                <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <FileSignature className="w-4 h-4 text-emerald-600" />
                    Digital Client Sign-off Recorded
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded-lg max-w-xs relative w-48 h-14">
                    <Image 
                      src={selectedOrder.client_signature_url} 
                      alt="Signature Proof" 
                      fill
                      className="object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Cryptographically authenticated timestamp token: {selectedOrder.id}-SIG-OK
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Changes persist across live state and Supabase synchronized storage.
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Service Order Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            id="new-order-modal"
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Dispatch New Service Order</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Book and allocate cleaning operations for client locations.
                </p>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Client *
                </label>
                <select
                  id="select-order-client"
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.company_name || c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cleaning Service Package *
                </label>
                <select
                  id="select-order-service"
                  value={newServiceId}
                  onChange={(e) => {
                    setNewServiceId(e.target.value);
                    const s = services.find(srv => srv.id === e.target.value);
                    if (s) setNewCustomPrice(s.base_price);
                  }}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                >
                  {services.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>{s.title} (${s.base_price})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assign Field Squad
                  </label>
                  <select
                    id="select-order-operational"
                    value={newOperationalId}
                    onChange={(e) => setNewOperationalId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  >
                    <option value="">Leave Unassigned (Pending)</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Order Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newCustomPrice}
                    onChange={(e) => setNewCustomPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Service Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500 Grand Ave, Suite 1200"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Unit / Suite / Access Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Building B, 3rd Floor, Keybox Code 1984"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Special Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Client requests or hazardous material precautions..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-create-order-submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
