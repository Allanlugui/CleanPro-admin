export const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- CLEANING SERVICE COMPANY ECOSYSTEM - SUPABASE DATABASE SCHEMA (PHASE 1)
-- ==============================================================================
-- Core Tables:
-- 1. profiles (id, full_type [admin, operational, client], email, phone, created_at)
-- 2. services (id, title, description, base_price, category, created_at)
-- 3. service_orders (id, client_id, operational_id, service_id, status, scheduled_date, total_price, client_signature_url, created_at)
-- 4. support_tickets (id, client_id, subject, status [open, resolved], created_at)
-- 5. chat_messages (id, ticket_id, sender_id, message, created_at)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing tables if resetting schema
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS service_orders CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (RBAC: admin, operational, client)
-- ------------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_type TEXT NOT NULL CHECK (full_type IN ('admin', 'operational', 'client')) DEFAULT 'client',
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    company_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_full_type ON profiles(full_type);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ------------------------------------------------------------------------------
-- 2. SERVICES CATALOG TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
    category TEXT NOT NULL CHECK (category IN (
        'Residential', 
        'Commercial', 
        'Deep Cleaning', 
        'Post-Construction', 
        'Disinfection & Sanitization', 
        'Move-In/Move-Out', 
        'Carpet & Upholstery'
    )),
    duration_minutes INTEGER NOT NULL DEFAULT 120 CHECK (duration_minutes > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_is_active ON services(is_active);

-- ------------------------------------------------------------------------------
-- 3. SERVICE ORDERS TABLE (OPERATIONS & DISPATCHER)
-- ------------------------------------------------------------------------------
CREATE TABLE service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    operational_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN (
        'pending', 
        'assigned', 
        'in_progress', 
        'completed', 
        'cancelled'
    )) DEFAULT 'pending',
    scheduled_date TIMESTAMPTZ NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    address TEXT NOT NULL,
    unit_or_suite TEXT,
    notes TEXT,
    client_signature_url TEXT,
    inspection_photos TEXT[] DEFAULT '{}'::text[],
    checklist JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON service_orders(status);
CREATE INDEX idx_orders_scheduled_date ON service_orders(scheduled_date);
CREATE INDEX idx_orders_client_id ON service_orders(client_id);
CREATE INDEX idx_orders_operational_id ON service_orders(operational_id);

-- ------------------------------------------------------------------------------
-- 4. SUPPORT TICKETS TABLE (SAC & OMBUDSMAN)
-- ------------------------------------------------------------------------------
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    service_order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General Inquiry',
    status TEXT NOT NULL CHECK (status IN (
        'open', 
        'in_progress', 
        'resolved', 
        'closed'
    )) DEFAULT 'open',
    priority TEXT NOT NULL CHECK (priority IN (
        'low', 
        'medium', 
        'high', 
        'urgent'
    )) DEFAULT 'medium',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_tickets_client ON support_tickets(client_id);
CREATE INDEX idx_tickets_assigned_to ON support_tickets(assigned_to);

-- ------------------------------------------------------------------------------
-- 5. CHAT MESSAGES TABLE (REAL-TIME SAC AUDITABLE MESSAGING)
-- ------------------------------------------------------------------------------
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}'::text[],
    is_internal_note BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_ticket_id ON chat_messages(ticket_id);
CREATE INDEX idx_chat_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_created_at ON chat_messages(created_at ASC);

-- ------------------------------------------------------------------------------
-- 6. AUTOMATED TIMESTAMP UPDATE TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_services_modtime
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_service_orders_modtime
    BEFORE UPDATE ON service_orders
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_support_tickets_modtime
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES & RBAC (GDPR / LGPD COMPATIBLE)
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT full_type FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles Security
CREATE POLICY "Admins have full access to profiles"
    ON profiles FOR ALL
    USING (public.current_user_role() = 'admin');

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Services Security
CREATE POLICY "Authenticated users can view active services"
    ON services FOR SELECT
    USING (is_active = true OR public.current_user_role() = 'admin');

CREATE POLICY "Admins can manage services catalog"
    ON services FOR ALL
    USING (public.current_user_role() = 'admin');

-- Service Orders Security
CREATE POLICY "Admins full management on orders"
    ON service_orders FOR ALL
    USING (public.current_user_role() = 'admin');

CREATE POLICY "Operational staff view assigned orders"
    ON service_orders FOR SELECT
    USING (operational_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Operational staff update order checklist & status"
    ON service_orders FOR UPDATE
    USING (operational_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Clients can view own orders"
    ON service_orders FOR SELECT
    USING (client_id = auth.uid());

CREATE POLICY "Clients can create new service orders"
    ON service_orders FOR INSERT
    WITH CHECK (client_id = auth.uid());

-- Support Tickets Security
CREATE POLICY "Admins and Staff view all tickets"
    ON support_tickets FOR ALL
    USING (public.current_user_role() IN ('admin', 'operational'));

CREATE POLICY "Clients view own tickets"
    ON support_tickets FOR SELECT
    USING (client_id = auth.uid());

CREATE POLICY "Clients submit support tickets"
    ON support_tickets FOR INSERT
    WITH CHECK (client_id = auth.uid());

-- Chat Messages Security
CREATE POLICY "Staff can view and send chat messages"
    ON chat_messages FOR ALL
    USING (public.current_user_role() IN ('admin', 'operational'));

CREATE POLICY "Clients view non-internal ticket messages"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE support_tickets.id = chat_messages.ticket_id 
            AND support_tickets.client_id = auth.uid()
        )
        AND is_internal_note = false
    );

CREATE POLICY "Clients post messages to own ticket"
    ON chat_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE support_tickets.id = chat_messages.ticket_id 
            AND support_tickets.client_id = auth.uid()
        )
    );
`;
