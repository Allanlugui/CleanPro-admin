'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Service, ServiceCategory } from '@/types/database';
import { 
  Layers, 
  Plus, 
  Search, 
  Clock, 
  DollarSign, 
  Check, 
  Edit3, 
  Trash2, 
  Filter, 
  Sparkles,
  Shield,
  Tag,
  CheckCircle2,
  X
} from 'lucide-react';

const CATEGORIES: (ServiceCategory | 'All')[] = [
  'All',
  'Commercial',
  'Residential',
  'Deep Cleaning',
  'Post-Construction',
  'Disinfection & Sanitization',
  'Move-In/Move-Out',
  'Carpet & Upholstery'
];

export function ServicesModule() {
  const { services, addService, updateService, deleteService, currentRole, searchQuery } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(250);
  const [category, setCategory] = useState<ServiceCategory>('Residential');
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [featureInput, setFeatureInput] = useState('');
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingService(null);
    setTitle('');
    setDescription('');
    setBasePrice(250);
    setCategory('Residential');
    setDurationMinutes(120);
    setFeaturesList(['Eco-friendly certified formulas', 'HEPA vacuum extraction', 'Satisfaction sign-off audit']);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (srv: Service) => {
    setEditingService(srv);
    setTitle(srv.title);
    setDescription(srv.description || '');
    setBasePrice(srv.base_price);
    setCategory(srv.category);
    setDurationMinutes(srv.duration_minutes);
    setFeaturesList(srv.features || []);
    setIsActive(srv.is_active);
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (featureInput.trim() && !featuresList.includes(featureInput.trim())) {
      setFeaturesList([...featuresList, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingService) {
      updateService(editingService.id, {
        title,
        description,
        base_price: Number(basePrice),
        category,
        duration_minutes: Number(durationMinutes),
        features: featuresList,
        is_active: isActive,
      });
    } else {
      addService({
        title,
        description,
        base_price: Number(basePrice),
        category,
        duration_minutes: Number(durationMinutes),
        features: featuresList,
        is_active: isActive,
      });
    }
    setIsModalOpen(false);
  };

  const filteredServices = services.filter((srv) => {
    const matchesCategory = selectedCategory === 'All' || srv.category === selectedCategory;
    const matchesQuery = !searchQuery || 
      srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.description && srv.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      srv.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const isAdmin = currentRole === 'admin';

  return (
    <div id="services-module-container" className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-600" />
            Cleaning Services Catalog & Pricing Models
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage service definitions, custom pricing rates, duration estimates, and category assignments.
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-add-new-service"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Service
          </button>
        )}
      </div>

      {/* RBAC Notice if not Admin */}
      {!isAdmin && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Read-Only Mode:</strong> Logged in as <span className="font-semibold capitalize">{currentRole}</span>. Service catalog modifications require <strong>Admin</strong> privileges. Switch roles in the top bar to test editing.
            </span>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            id={`filter-category-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({services.filter(s => s.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            id={`service-card-${service.id}`}
            className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
              service.is_active ? 'border-slate-200' : 'border-slate-200/60 opacity-75 bg-slate-50/50'
            }`}
          >
            {/* Card Header */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
                  <Tag className="w-3 h-3 text-cyan-600" />
                  {service.category}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      service.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 leading-snug">
                  {service.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {service.description || 'No description provided.'}
                </p>
              </div>

              {/* Feature Tags */}
              {service.features && service.features.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Included Specs:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {service.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-normal"
                      >
                        <Check className="w-3 h-3 text-cyan-600" />
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer with Price & Actions */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Base Pricing Rate</div>
                <div className="text-lg font-bold text-slate-900">
                  ${service.base_price.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal ml-1">/ session</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Est. {service.duration_minutes} mins ({Math.round(service.duration_minutes / 60 * 10) / 10} hrs)
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <button
                    id={`btn-edit-service-${service.id}`}
                    onClick={() => openEditModal(service)}
                    className="p-2 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 border border-slate-200 transition-colors"
                    title="Edit Service"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    id={`btn-delete-service-${service.id}`}
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${service.title}"?`)) {
                        deleteService(service.id);
                      }
                    }}
                    className="p-2 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                    title="Delete Service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700">No Services Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No cleaning services match the selected category or search keywords.
          </p>
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            id="service-modal-dialog"
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingService ? 'Edit Cleaning Service' : 'Create New Cleaning Service'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update database catalog attributes and base pricing formula.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Service Title *
                </label>
                <input
                  id="input-service-title"
                  type="text"
                  required
                  placeholder="e.g. Commercial Office Deep Sanitization"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    id="select-service-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Base Price ($) *
                  </label>
                  <input
                    id="input-service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estimated Duration (mins)
                  </label>
                  <input
                    id="input-service-duration"
                    type="number"
                    min="15"
                    step="15"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="checkbox-service-active"
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Catalog Active for Booking</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  id="textarea-service-description"
                  rows={3}
                  placeholder="Scope of work, standard procedures, equipment used..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>

              {/* Feature Bullets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Service Feature Highlights
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Hospital-grade virucidal spray"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {featuresList.map((feat, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200"
                    >
                      {feat}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(i)}
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-service-submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm"
                >
                  {editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
