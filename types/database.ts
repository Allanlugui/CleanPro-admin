export type UserRole = 'admin' | 'operational' | 'client';

export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ServiceCategory = 
  | 'Residential' 
  | 'Commercial' 
  | 'Deep Cleaning' 
  | 'Post-Construction' 
  | 'Disinfection & Sanitization' 
  | 'Move-In/Move-Out' 
  | 'Carpet & Upholstery';

export interface Profile {
  id: string;
  full_type: UserRole;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  company_name?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string | null;
  base_price: number;
  category: ServiceCategory;
  duration_minutes: number;
  is_active: boolean;
  features?: string[];
  created_at: string;
  updated_at?: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  completed_by?: string;
  timestamp?: string;
}

export interface ServiceOrder {
  id: string;
  client_id: string;
  operational_id: string | null;
  service_id: string;
  status: OrderStatus;
  scheduled_date: string;
  total_price: number;
  address: string;
  unit_or_suite?: string | null;
  notes?: string | null;
  client_signature_url?: string | null;
  inspection_photos: string[];
  checklist: ChecklistItem[];
  created_at: string;
  updated_at?: string;
  // Joined relation fields for dashboard UI convenience
  client?: Profile;
  operational?: Profile | null;
  service?: Service;
}

export interface SupportTicket {
  id: string;
  client_id: string;
  assigned_to: string | null;
  service_order_id: string | null;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  resolution_notes?: string | null;
  created_at: string;
  updated_at?: string;
  // Joined relation fields
  client?: Profile;
  assigned_staff?: Profile | null;
  service_order?: ServiceOrder | null;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachments?: string[];
  is_internal_note?: boolean;
  created_at: string;
  // Joined
  sender?: Profile;
}
