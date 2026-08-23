'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { Profile } from '@/types/database';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  Building2, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Calendar,
  Layers,
  Key,
  X,
  AlertCircle,
  ExternalLink,
  Kanban,
  Check
} from 'lucide-react';
import { formatDateShort } from '@/lib/format-date';

export function OperationalTeamModule() {
  const { 
    technicians, 
    orders, 
    addTechnician, 
    updateTechnician, 
    deleteTechnician, 
    setActiveTab, 
    currentRole,
    searchQuery,
    setSearchQuery
  } = useApp();

  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState<Profile | null>(null);

  // Provision Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('CleanOps Field Squad Alpha');
  const [tempPassword, setTempPassword] = useState('TechField2026!');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [specialties, setSpecialties] = useState<string[]>(['Deep Cleaning', 'Hospital Disinfection']);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openProvisionModal = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setCompanyName('CleanOps Field Squad Alpha');
    setTempPassword('TechField2026!');
    setSpecialties(['Deep Cleaning', 'Hospital Disinfection']);
    setFormError(null);
    setIsProvisionModalOpen(true);
  };

  const openEditModal = (tech: Profile) => {
    setSelectedTech(tech);
    setFullName(tech.full_name);
    setEmail(tech.email);
    setPhone(tech.phone || '');
    setCompanyName(tech.company_name || 'CleanOps Field Squad');
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleAddSpecialty = () => {
    if (specialtyInput.trim() && !specialties.includes(specialtyInput.trim())) {
      setSpecialties([...specialties, specialtyInput.trim()]);
      setSpecialtyInput('');
    }
  };

  const handleRemoveSpecialty = (idx: number) => {
    setSpecialties(specialties.filter((_, i) => i !== idx));
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (!fullName.trim() || !email.trim() || !tempPassword.trim()) {
        throw new Error('Please fill in all required fields (Name, Email, Password).');
      }

      await addTechnician({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        company_name: companyName.trim() || 'CleanOps Field Squad',
        password: tempPassword,
      });

      setIsProvisionModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to provision operational technician.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTech) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      await updateTechnician(selectedTech.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        company_name: companyName.trim() || null,
      });
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update technician details.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tech: Profile) => {
    if (confirm(`Are you sure you want to decommission and delete technician account "${tech.full_name}"? Any active orders assigned to them will be unassigned.`)) {
      try {
        await deleteTechnician(tech.id);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete technician.');
      }
    }
  };

  const filteredTechs = technicians.filter((tech) => {
    const query = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      tech.full_name.toLowerCase().includes(query) ||
      tech.email.toLowerCase().includes(query) ||
      (tech.phone && tech.phone.toLowerCase().includes(query)) ||
      (tech.company_name && tech.company_name.toLowerCase().includes(query))
    );
  });

  // Calculate statistics
  const totalTechnicians = technicians.length;
  const activeOrdersCount = orders.filter(o => o.status === 'in_progress' || o.status === 'assigned').length;
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;

  return (
    <div id="operational-team-module" className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-600" />
            Operational Team & Technician Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Provision, manage, and monitor field technician credentials with role-based access control (RBAC).
          </p>
        </div>

        <button
          id="btn-provision-technician"
          onClick={openProvisionModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Provision New Technician
        </button>
      </div>

      {/* Security Governance Notice */}
      <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
            <Key className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">
              Strict Provisioning Policy (LGPD / GDPR Compliant)
            </div>
            <div className="text-[11px] text-slate-400">
              Technicians cannot self-register publicly. All operational accounts and credentials are created exclusively by Administrators.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
            Role: operational
          </span>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Field Technicians</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalTechnicians}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Active Profiles in Database
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Field Dispatches</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{activeOrdersCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Currently assigned or in progress</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Completed Jobs</div>
          <div className="text-2xl font-bold text-cyan-700 mt-1">{completedOrdersCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">With signed client verification</div>
        </div>
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechs.map((tech) => {
          const assignedOrders = orders.filter(o => o.operational_id === tech.id);
          const activeOrders = assignedOrders.filter(o => o.status === 'in_progress' || o.status === 'assigned');
          const isBusy = activeOrders.length > 0;

          return (
            <div
              key={tech.id}
              id={`tech-card-${tech.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                {/* Header with Avatar & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold text-base flex items-center justify-center shadow-xs">
                      {tech.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {tech.full_name}
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {tech.company_name || 'CleanOps Squad'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isBusy
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isBusy ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    {isBusy ? `${activeOrders.length} Active Job` : 'Available'}
                  </span>
                </div>

                {/* Contact Information */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{tech.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tech.phone || 'No phone recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Joined: {formatDateShort(tech.created_at)}</span>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Assigned Orders</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{assignedOrders.length} total</div>
                  </div>

                  <button
                    onClick={() => setActiveTab('operations')}
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    <span>View Kanban</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  id={`btn-edit-tech-${tech.id}`}
                  onClick={() => openEditModal(tech)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 border border-slate-200 transition-colors"
                  title="Edit Technician Profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  id={`btn-delete-tech-${tech.id}`}
                  onClick={() => handleDelete(tech)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                  title="Decommission & Delete Account"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTechs.length === 0 && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700">No Operational Technicians Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery ? 'No technician accounts match your search query.' : 'Click "Provision New Technician" to create the first field crew account.'}
          </p>
        </div>
      )}

      {/* Provision Technician Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-cyan-600" />
                  Provision Operational Technician
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generates Supabase Auth login credentials and assigns role <code className="text-cyan-700 font-mono">operational</code>.
                </p>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleProvisionSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Technician Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Mitchell"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jordan.tech@cleanops.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Squad / Branch Unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Field Squad Alpha"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Specialization Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Cleaning Disciplines & Certifications
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Hazardous Materials, Floor Burnishing"
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpecialty(); } }}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecialty}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialty(i)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Technician Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Technician Modal */}
      {isEditModalOpen && selectedTech && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Operational Technician</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedTech.email}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Squad / Branch
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
