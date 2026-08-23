'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SupportTicket, TicketPriority, TicketStatus } from '@/types/database';
import { formatTimeShort, formatDateTime } from '@/lib/format-date';
import { 
  Headphones, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  User, 
  Lock, 
  MessageSquare, 
  Sparkles, 
  Paperclip,
  Tag,
  Search,
  Check,
  ChevronRight,
  X
} from 'lucide-react';

export function SupportHub() {
  const { 
    tickets, 
    activeTicketId, 
    setActiveTicketId, 
    chatMessages, 
    sendChatMessage, 
    updateTicketStatus, 
    createTicket,
    currentUser, 
    currentRole,
    orders,
    searchQuery
  } = useApp();

  const [messageInput, setMessageInput] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  // New ticket form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Service Quality & Review');
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>('medium');
  const [ticketOrderId, setTicketOrderId] = useState<string>('');

  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  const activeTicket = tickets.find(t => t.id === activeTicketId) || tickets[0];
  const currentChatMessages = activeTicket ? (chatMessages[activeTicket.id] || []) : [];

  const filteredTickets = tickets.filter(t => {
    const matchesQuery = !searchQuery ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.client?.full_name && t.client.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (currentRole === 'client') {
      return matchesQuery && t.client_id === currentUser.id;
    }
    return matchesQuery;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeTicket) return;
    sendChatMessage(activeTicket.id, messageInput, isInternalNote);
    setMessageInput('');
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;
    createTicket(ticketSubject, ticketCategory, ticketOrderId || null, ticketPriority);
    setIsNewTicketModalOpen(false);
    setTicketSubject('');
  };

  const handleResolveTicket = () => {
    if (!activeTicket) return;
    updateTicketStatus(activeTicket.id, 'resolved', resolutionNoteInput);
    setShowResolveDialog(false);
    setResolutionNoteInput('');
  };

  return (
    <div id="support-hub-container" className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Headphones className="w-6 h-6 text-cyan-600" />
            Customer Support Hub (SAC & Ombudsman)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time ticket communications, client escalations, internal staff memos, and resolution tracking.
          </p>
        </div>

        <button
          id="btn-new-support-ticket"
          onClick={() => setIsNewTicketModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Open Support Ticket
        </button>
      </div>

      {/* Main Dual-Pane Ticket Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Ticket Queue */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Support Inquiries
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                {filteredTickets.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Live Queue</span>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
              const isActive = activeTicket?.id === ticket.id;
              return (
                <div
                  key={ticket.id}
                  id={`ticket-item-${ticket.id}`}
                  onClick={() => setActiveTicketId(ticket.id)}
                  className={`p-4 cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-cyan-50/70 border-l-4 border-cyan-600' 
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-mono font-medium text-slate-400">
                      {ticket.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        ticket.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                        ticket.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                        ticket.status === 'in_progress' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                    {ticket.subject}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="truncate max-w-[160px] font-medium text-slate-700">
                      {ticket.client?.full_name}
                    </span>
                    <span>
                      {formatTimeShort(ticket.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No support tickets found.
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Active Ticket Chat & Resolution Workspace */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[650px]">
          {activeTicket ? (
            <>
              {/* Active Ticket Banner */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-700">{activeTicket.id}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-600">{activeTicket.category}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {activeTicket.subject}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Client: <span className="font-medium text-slate-700">{activeTicket.client?.full_name}</span> ({activeTicket.client?.email})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeTicket.status !== 'resolved' ? (
                    <button
                      id="btn-resolve-ticket-dialog"
                      onClick={() => setShowResolveDialog(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolve Ticket
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolved
                    </span>
                  )}
                </div>
              </div>

              {/* Resolution Note if resolved */}
              {activeTicket.resolution_notes && (
                <div className="p-3 bg-emerald-50/80 border-b border-emerald-100 text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Official Ombudsman Resolution: </span>
                    {activeTicket.resolution_notes}
                  </div>
                </div>
              )}

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {currentChatMessages.map((msg) => {
                  const isCurrentUser = msg.sender_id === currentUser.id;
                  const isInternal = msg.is_internal_note;

                  // If user is client, hide internal notes (LGPD/compliance rule)
                  if (currentRole === 'client' && isInternal) return null;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {msg.sender?.full_name || 'Staff'}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          ({msg.sender?.full_type || 'User'}) • {formatTimeShort(msg.created_at)}
                        </span>
                        {isInternal && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Lock className="w-2.5 h-2.5" /> Internal Memo
                          </span>
                        )}
                      </div>

                      <div
                        className={`max-w-md rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                          isInternal
                            ? 'bg-amber-50/90 border border-amber-200 text-amber-950 rounded-tr-none'
                            : isCurrentUser
                            ? 'bg-cyan-600 text-white rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white">
                {currentRole !== 'client' && (
                  <div className="flex items-center gap-2 mb-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300"
                      />
                      <span className={`text-[11px] font-medium ${isInternalNote ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                        Lock as Internal Staff Note (Invisible to Client)
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={isInternalNote ? "Write private operational memo..." : "Reply to client..."}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    id="btn-send-chat-message"
                    disabled={!messageInput.trim()}
                    className="p-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Select a support ticket to start live resolution</p>
              <p className="text-xs text-slate-400">All messages stream to Supabase realtime channels.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Dialog Modal */}
      {showResolveDialog && activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Mark Ticket as Resolved
            </h3>
            <p className="text-xs text-slate-500">
              Provide the official resolution statement for audit records and client confirmation.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Squad re-inspected premises, completed dusting of cooling racks, client confirmed satisfaction."
              value={resolutionNoteInput}
              onChange={(e) => setResolutionNoteInput(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowResolveDialog(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-resolve-ticket"
                onClick={handleResolveTicket}
                className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Open New Support / SAC Ticket</h3>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Summary of inquiry or incident..."
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="Service Quality & Review">Service Quality & Review</option>
                    <option value="Schedule Adjustment">Schedule Adjustment</option>
                    <option value="Special Instruction">Special Instruction</option>
                    <option value="Billing & Invoicing">Billing & Invoicing</option>
                    <option value="Ombudsman Escalation">Ombudsman Escalation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as TicketPriority)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Link to Service Order (Optional)
                </label>
                <select
                  value={ticketOrderId}
                  onChange={(e) => setTicketOrderId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="">-- None (General Inquiries) --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.id} - {o.service?.title} ({o.address})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
