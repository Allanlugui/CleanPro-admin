'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  Profile, 
  Service, 
  ServiceOrder, 
  SupportTicket, 
  ChatMessage, 
  UserRole, 
  OrderStatus, 
  TicketStatus,
  ServiceCategory
} from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { formatTimeShort } from '@/lib/format-date';

export type ActiveTab = 'operations' | 'services' | 'team' | 'support' | 'analytics' | 'schema';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  // Authentication & RBAC
  isAuthenticated: boolean;
  currentUser: Profile;
  setCurrentUser: (profile: Profile) => void;
  login: (profile: Profile) => void;
  logout: () => Promise<void>;
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  
  // Profiles & Technicians
  allProfiles: Profile[];
  technicians: Profile[];
  addTechnician: (data: { full_name: string; email: string; phone?: string | null; company_name?: string | null; password?: string }) => Promise<Profile>;
  updateTechnician: (id: string, updates: Partial<Profile>) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
  
  // Services CRUD
  services: Service[];
  addService: (service: Omit<Service, 'id' | 'created_at'>) => Promise<void>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  
  // Orders & Dispatching
  orders: ServiceOrder[];
  addOrder: (order: Omit<ServiceOrder, 'id' | 'created_at' | 'checklist' | 'inspection_photos'>) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  assignTechnician: (orderId: string, technicianId: string | null) => Promise<void>;
  toggleChecklistItem: (orderId: string, checklistId: string) => Promise<void>;
  addInspectionPhoto: (orderId: string, photoUrl: string) => Promise<void>;
  
  // Support Tickets & Real-time Chat
  tickets: SupportTicket[];
  activeTicketId: string | null;
  setActiveTicketId: (id: string | null) => void;
  chatMessages: Record<string, ChatMessage[]>;
  sendChatMessage: (ticketId: string, message: string, isInternal?: boolean) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus, notes?: string) => Promise<void>;
  createTicket: (subject: string, category: string, serviceOrderId?: string | null, priority?: 'low' | 'medium' | 'high' | 'urgent') => Promise<void>;
  
  // Supabase State & Utilities
  isLiveSupabase: boolean;
  isLoading: boolean;
  isRealtimeConnected: boolean;
  refreshData: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const DEFAULT_ADMIN_PROFILE: Profile = {
  id: 'a1111111-1111-4111-a111-111111111111',
  email: 'admin@cleanops.com',
  full_name: 'Allan (System Administrator)',
  full_type: 'admin',
  phone: '+1 (555) 019-2834',
  company_name: 'CleanOps Global Ecosystems',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  created_at: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('operations');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<Profile>(DEFAULT_ADMIN_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);

  // Entities state
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Keep a ref to profiles to hydrate joined entities easily
  const profilesMapRef = useRef<Map<string, Profile>>(new Map());
  const servicesMapRef = useRef<Map<string, Service>>(new Map());

  // Technicians derived list
  const technicians = allProfiles.filter(p => p.full_type === 'operational');

  // Helper to re-map relations
  const hydrateOrders = useCallback((rawOrders: any[], profMap: Map<string, Profile>, srvMap: Map<string, Service>): ServiceOrder[] => {
    return rawOrders.map(ord => ({
      ...ord,
      checklist: Array.isArray(ord.checklist) ? ord.checklist : [],
      inspection_photos: Array.isArray(ord.inspection_photos) ? ord.inspection_photos : [],
      client: profMap.get(ord.client_id) || {
        id: ord.client_id,
        email: 'client@nexus.com',
        full_name: 'Client Order Profile',
        full_type: 'client',
        created_at: ord.created_at,
      },
      operational: ord.operational_id ? profMap.get(ord.operational_id) : null,
      service: srvMap.get(ord.service_id) || {
        id: ord.service_id,
        title: 'Custom Cleaning Service',
        description: '',
        base_price: Number(ord.total_price) || 200,
        category: 'Commercial',
        duration_minutes: 120,
        is_active: true,
        created_at: ord.created_at,
      },
    }));
  }, []);

  const hydrateTickets = useCallback((rawTickets: any[], profMap: Map<string, Profile>, ordList: ServiceOrder[]): SupportTicket[] => {
    return rawTickets.map(tkt => ({
      ...tkt,
      client: profMap.get(tkt.client_id) || {
        id: tkt.client_id,
        email: 'client@cleanops.com',
        full_name: 'Client Inquirer',
        full_type: 'client',
        created_at: tkt.created_at,
      },
      assigned_staff: tkt.assigned_to ? profMap.get(tkt.assigned_to) : null,
      service_order: tkt.service_order_id ? ordList.find(o => o.id === tkt.service_order_id) || null : null,
    }));
  }, []);

  // Fetch all database tables
  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch Profiles
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profErr) console.warn('Supabase profiles fetch notice:', profErr.message);
      
      const loadedProfiles: Profile[] = profData || [];
      setAllProfiles(loadedProfiles);
      
      const profMap = new Map<string, Profile>();
      loadedProfiles.forEach(p => profMap.set(p.id, p));
      profilesMapRef.current = profMap;

      // 2. Fetch Services
      const { data: srvData, error: srvErr } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (srvErr) console.warn('Supabase services fetch notice:', srvErr.message);
      
      const loadedServices: Service[] = (srvData || []).map(s => ({
        ...s,
        base_price: Number(s.base_price),
      }));
      setServices(loadedServices);

      const srvMap = new Map<string, Service>();
      loadedServices.forEach(s => srvMap.set(s.id, s));
      servicesMapRef.current = srvMap;

      // 3. Fetch Service Orders
      const { data: ordData, error: ordErr } = await supabase
        .from('service_orders')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (ordErr) console.warn('Supabase orders fetch notice:', ordErr.message);
      
      const hydratedOrders = hydrateOrders(ordData || [], profMap, srvMap);
      setOrders(hydratedOrders);

      // 4. Fetch Support Tickets
      const { data: tktData, error: tktErr } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (tktErr) console.warn('Supabase tickets fetch notice:', tktErr.message);
      
      const hydratedTickets = hydrateTickets(tktData || [], profMap, hydratedOrders);
      setTickets(hydratedTickets);

      if (hydratedTickets.length > 0 && !activeTicketId) {
        setActiveTicketId(hydratedTickets[0].id);
      }

      // 5. Fetch Chat Messages
      const { data: msgData, error: msgErr } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (msgErr) console.warn('Supabase chat messages fetch notice:', msgErr.message);

      const messagesByTicket: Record<string, ChatMessage[]> = {};
      (msgData || []).forEach(msg => {
        const fullMsg: ChatMessage = {
          ...msg,
          sender: profMap.get(msg.sender_id),
        };
        if (!messagesByTicket[msg.ticket_id]) {
          messagesByTicket[msg.ticket_id] = [];
        }
        messagesByTicket[msg.ticket_id].push(fullMsg);
      });
      setChatMessages(messagesByTicket);

    } catch (error) {
      console.error('Failed to load Supabase tables:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hydrateOrders, hydrateTickets, activeTicketId]);

  // Auth Lifecycle Check and initial data fetch on Mount
  useEffect(() => {
    let isCancelled = false;

    const initialize = async () => {
      const sessionActive = localStorage.getItem('cleanops_session_active') === 'true' || 
                            sessionStorage.getItem('cleanops_session_active') === 'true';

      if (sessionActive && !isCancelled) {
        setIsAuthenticated(true);
      }

      if (!isSupabaseConfigured || !supabase) {
        if (!isCancelled) setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !isCancelled) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && profile.full_type === 'admin') {
            setCurrentUser(profile);
            setIsAuthenticated(true);
          }
        }
        await fetchData();
      } catch (err) {
        console.warn('Session verification notice:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      isCancelled = true;
    };
  }, [fetchData]);

  // Real-Time Subscriptions Channel (Supabase Realtime)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('cleanops-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_orders' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as ChatMessage;
            setChatMessages(prev => ({
              ...prev,
              [newMsg.ticket_id]: [
                ...(prev[newMsg.ticket_id] || []),
                {
                  ...newMsg,
                  sender: profilesMapRef.current.get(newMsg.sender_id) || currentUser,
                }
              ]
            }));
          } else {
            fetchData();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchData();
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [fetchData, currentUser]);

  // Auth Operations
  const login = (profile: Profile) => {
    setCurrentUser(profile);
    setIsAuthenticated(true);
    fetchData();
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out notice:', err);
      }
    }
    localStorage.removeItem('cleanops_session_active');
    sessionStorage.removeItem('cleanops_session_active');
    setIsAuthenticated(false);
  };

  const setRole = (role: UserRole) => {
    const matchedProfile = allProfiles.find(p => p.full_type === role) || {
      ...currentUser,
      full_type: role,
    };
    setCurrentUser(matchedProfile);
  };

  // ---------------------------------------------------------------------------
  // TECHNICIANS (OPERATIONAL) CRUD
  // ---------------------------------------------------------------------------
  const addTechnician = async (data: {
    full_name: string;
    email: string;
    phone?: string | null;
    company_name?: string | null;
    password?: string;
  }): Promise<Profile> => {
    // 1. Call server-side provision API
    const res = await fetch('/api/admin/technicians', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to provision technician');
    }

    const newTech: Profile = result.technician;
    setAllProfiles(prev => [newTech, ...prev.filter(p => p.id !== newTech.id)]);
    profilesMapRef.current.set(newTech.id, newTech);
    return newTech;
  };

  const updateTechnician = async (id: string, updates: Partial<Profile>): Promise<void> => {
    const res = await fetch('/api/admin/technicians', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to update technician');
    }

    setAllProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
  };

  const deleteTechnician = async (id: string): Promise<void> => {
    const res = await fetch(`/api/admin/technicians?id=${id}`, {
      method: 'DELETE',
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to delete technician');
    }

    setAllProfiles(prev => prev.filter(p => p.id !== id));
    // Update local orders where technician was assigned
    setOrders(prev => prev.map(o => o.operational_id === id ? { ...o, operational_id: null, operational: null, status: 'pending' } : o));
  };

  // ---------------------------------------------------------------------------
  // SERVICES CRUD
  // ---------------------------------------------------------------------------
  const addService = async (newService: Omit<Service, 'id' | 'created_at'>) => {
    const optimisticId = crypto.randomUUID();
    const serviceRecord: Service = {
      ...newService,
      id: optimisticId,
      created_at: new Date().toISOString(),
    };

    setServices(prev => [serviceRecord, ...prev]);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('services')
        .insert({
          title: newService.title,
          description: newService.description,
          base_price: newService.base_price,
          category: newService.category,
          duration_minutes: newService.duration_minutes,
          is_active: newService.is_active,
          features: newService.features || [],
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error inserting service:', error);
      } else if (data) {
        setServices(prev => prev.map(s => s.id === optimisticId ? { ...data, base_price: Number(data.base_price) } : s));
      }
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('services')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) console.error('Supabase error updating service:', error);
    }
  };

  const deleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) console.error('Supabase error deleting service:', error);
    }
  };

  // ---------------------------------------------------------------------------
  // ORDERS CRUD & DISPATCHING
  // ---------------------------------------------------------------------------
  const addOrder = async (orderData: Omit<ServiceOrder, 'id' | 'created_at' | 'checklist' | 'inspection_photos'>) => {
    const client = allProfiles.find(p => p.id === orderData.client_id) || currentUser;
    const service = services.find(s => s.id === orderData.service_id);
    const operational = orderData.operational_id ? allProfiles.find(p => p.id === orderData.operational_id) : null;

    const initialChecklist = [
      { id: `chk-${Date.now()}-1`, task: 'Initial premises inspection and hazard check', completed: false },
      { id: `chk-${Date.now()}-2`, task: 'Standard sanitization and service execution', completed: false },
      { id: `chk-${Date.now()}-3`, task: 'Client satisfaction walkthrough sign-off', completed: false },
    ];

    const optimisticId = crypto.randomUUID();
    const newOrder: ServiceOrder = {
      ...orderData,
      id: optimisticId,
      checklist: initialChecklist,
      inspection_photos: [],
      created_at: new Date().toISOString(),
      client,
      operational,
      service,
    };

    setOrders(prev => [newOrder, ...prev]);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('service_orders')
        .insert({
          client_id: orderData.client_id,
          operational_id: orderData.operational_id,
          service_id: orderData.service_id,
          status: orderData.status,
          scheduled_date: orderData.scheduled_date,
          total_price: orderData.total_price,
          address: orderData.address,
          unit_or_suite: orderData.unit_or_suite,
          notes: orderData.notes,
          checklist: initialChecklist,
          inspection_photos: [],
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding order:', error);
      } else if (data) {
        setOrders(prev => prev.map(o => o.id === optimisticId ? { ...o, id: data.id } : o));
      }
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status, updated_at: new Date().toISOString() } : order));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('service_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) console.error('Supabase order status error:', error);
    }
  };

  const assignTechnician = async (orderId: string, technicianId: string | null) => {
    const tech = technicianId ? allProfiles.find(p => p.id === technicianId) : null;
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        operational_id: technicianId,
        operational: tech,
        status: technicianId && order.status === 'pending' ? 'assigned' : order.status,
        updated_at: new Date().toISOString(),
      };
    }));

    if (isSupabaseConfigured && supabase) {
      const order = orders.find(o => o.id === orderId);
      const newStatus = technicianId && order?.status === 'pending' ? 'assigned' : order?.status || 'pending';
      const { error } = await supabase
        .from('service_orders')
        .update({
          operational_id: technicianId,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) console.error('Supabase order assign error:', error);
    }
  };

  const toggleChecklistItem = async (orderId: string, checklistId: string) => {
    let updatedChecklist: any[] = [];

    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      updatedChecklist = order.checklist.map(item => {
        if (item.id !== checklistId) return item;
        const nowCompleted = !item.completed;
        return {
          ...item,
          completed: nowCompleted,
          completed_by: nowCompleted ? currentUser.full_name : undefined,
          timestamp: nowCompleted ? formatTimeShort(new Date()) : undefined,
        };
      });
      return { ...order, checklist: updatedChecklist };
    }));

    if (isSupabaseConfigured && supabase && updatedChecklist.length > 0) {
      const { error } = await supabase
        .from('service_orders')
        .update({
          checklist: updatedChecklist,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) console.error('Supabase checklist update error:', error);
    }
  };

  const addInspectionPhoto = async (orderId: string, photoUrl: string) => {
    let updatedPhotos: string[] = [];

    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      updatedPhotos = [...order.inspection_photos, photoUrl];
      return {
        ...order,
        inspection_photos: updatedPhotos,
      };
    }));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('service_orders')
        .update({
          inspection_photos: updatedPhotos,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) console.error('Supabase inspection photo update error:', error);
    }
  };

  // ---------------------------------------------------------------------------
  // SUPPORT TICKETS & REAL-TIME CHAT
  // ---------------------------------------------------------------------------
  const sendChatMessage = async (ticketId: string, message: string, isInternal = false) => {
    if (!message.trim()) return;

    const optimisticId = crypto.randomUUID();
    const newMessage: ChatMessage = {
      id: optimisticId,
      ticket_id: ticketId,
      sender_id: currentUser.id,
      sender: currentUser,
      message,
      is_internal_note: isInternal,
      created_at: new Date().toISOString(),
    };

    setChatMessages(prev => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] || []), newMessage],
    }));

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId && t.status === 'open') {
        return { ...t, status: 'in_progress', updated_at: new Date().toISOString() };
      }
      return t;
    }));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: currentUser.id,
          message,
          is_internal_note: isInternal,
        });

      if (error) console.error('Supabase chat send error:', error);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus, notes?: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        status,
        resolution_notes: notes || t.resolution_notes,
        updated_at: new Date().toISOString(),
      };
    }));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status,
          resolution_notes: notes || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) console.error('Supabase ticket status error:', error);
    }
  };

  const createTicket = async (
    subject: string, 
    category: string, 
    serviceOrderId: string | null = null,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) => {
    const optimisticId = crypto.randomUUID();
    const newTicket: SupportTicket = {
      id: optimisticId,
      client_id: currentUser.id,
      client: currentUser,
      assigned_to: allProfiles.find(p => p.full_type === 'admin')?.id || null,
      assigned_staff: allProfiles.find(p => p.full_type === 'admin'),
      service_order_id: serviceOrderId,
      service_order: serviceOrderId ? orders.find(o => o.id === serviceOrderId) : null,
      subject,
      category,
      status: 'open',
      priority,
      created_at: new Date().toISOString(),
      unread_count: 0,
    };

    setTickets(prev => [newTicket, ...prev]);
    setActiveTicketId(optimisticId);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          client_id: currentUser.id,
          assigned_to: newTicket.assigned_to,
          service_order_id: serviceOrderId,
          subject,
          category,
          status: 'open',
          priority,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase create ticket error:', error);
      } else if (data) {
        setTickets(prev => prev.map(t => t.id === optimisticId ? { ...t, id: data.id } : t));
        setActiveTicketId(data.id);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isAuthenticated,
        currentUser,
        setCurrentUser,
        login,
        logout,
        currentRole: currentUser.full_type,
        setRole,
        allProfiles,
        technicians,
        addTechnician,
        updateTechnician,
        deleteTechnician,
        services,
        addService,
        updateService,
        deleteService,
        orders,
        addOrder,
        updateOrderStatus,
        assignTechnician,
        toggleChecklistItem,
        addInspectionPhoto,
        tickets,
        activeTicketId,
        setActiveTicketId,
        chatMessages,
        sendChatMessage,
        updateTicketStatus,
        createTicket,
        isLiveSupabase: isSupabaseConfigured,
        isLoading,
        isRealtimeConnected,
        refreshData: fetchData,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
