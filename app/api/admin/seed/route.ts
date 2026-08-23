import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return NextResponse.json(
      { error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and key.' },
      { status: 500 }
    );
  }

  try {
    const { action } = await req.json().catch(() => ({ action: 'seed' }));

    // 1. Initial Admin Profile
    const adminId = 'a1111111-1111-4111-a111-111111111111';
    await (adminClient as any).from('profiles').upsert([
      {
        id: adminId,
        email: 'admin@cleanops.com',
        full_name: 'Allan (System Administrator)',
        full_type: 'admin',
        phone: '+1 (555) 019-2834',
        company_name: 'CleanOps Global Ecosystems',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      }
    ]);

    // 2. Operational Technicians
    const tech1Id = 'b2222222-2222-4222-b222-222222222222';
    const tech2Id = 'c3333333-3333-4333-c333-333333333333';
    const tech3Id = 'd4444444-4444-4444-d444-444444444444';

    await (adminClient as any).from('profiles').upsert([
      {
        id: tech1Id,
        email: 'marcus.squad@cleanops.com',
        full_name: 'Marcus Vance',
        full_type: 'operational',
        phone: '+1 (555) 342-9812',
        company_name: 'CleanOps Field Alpha',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        id: tech2Id,
        email: 'elena.tech@cleanops.com',
        full_name: 'Elena Rostova',
        full_type: 'operational',
        phone: '+1 (555) 781-4490',
        company_name: 'CleanOps Field Bravo',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      {
        id: tech3Id,
        email: 'carlos.crew@cleanops.com',
        full_name: 'Carlos Mendez',
        full_type: 'operational',
        phone: '+1 (555) 612-8821',
        company_name: 'CleanOps Field Delta',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      }
    ]);

    // 3. Client Profiles
    const client1Id = 'e5555555-5555-4555-e555-555555555555';
    const client2Id = 'f6666666-6666-4666-f666-666666666666';

    await (adminClient as any).from('profiles').upsert([
      {
        id: client1Id,
        email: 'sarah.corporation@nexus.com',
        full_name: 'Nexus Real Estate Corp',
        full_type: 'client',
        phone: '+1 (555) 901-4412',
        company_name: 'Nexus Towers LLC',
      },
      {
        id: client2Id,
        email: 'david.b@horizontech.io',
        full_name: 'Horizon Tech Labs',
        full_type: 'client',
        phone: '+1 (555) 833-2199',
        company_name: 'Horizon Bio & Robotics',
      }
    ]);

    // 4. Initial Cleaning Services Catalog
    const srv1Id = '11111111-1111-4111-8111-111111111111';
    const srv2Id = '22222222-2222-4222-8222-222222222222';
    const srv3Id = '33333333-3333-4333-8333-333333333333';
    const srv4Id = '44444444-4444-4444-8444-444444444444';

    await (adminClient as any).from('services').upsert([
      {
        id: srv1Id,
        title: 'Commercial Office Sanitization & Deep Sweep',
        description: 'Comprehensive medical-grade disinfection for corporate headquarters, open-plan workspaces, and executive boardrooms.',
        base_price: 450.00,
        category: 'Commercial',
        duration_minutes: 180,
        is_active: true,
        features: ['HEPA multi-stage air scrubbers', 'Hospital-grade virucidal mist', 'ATP fluorescence validation test'],
      },
      {
        id: srv2Id,
        title: 'Residential Deep Turn-Key Cleaning',
        description: 'Intensive restoration for multi-story residences, kitchen degreasing, bathroom descaling, and high-touch surface sterilization.',
        base_price: 280.00,
        category: 'Deep Cleaning',
        duration_minutes: 240,
        is_active: true,
        features: ['Eco-certified botanical cleaning agents', 'Grout line steam pressure washing', 'Double inspection sign-off'],
      },
      {
        id: srv3Id,
        title: 'Post-Construction Debris & Fine Dust Removal',
        description: 'Specialized industrial vacuuming, paint spot detailing, HVAC vent dust trapping, and polished floor burnishing.',
        base_price: 650.00,
        category: 'Post-Construction',
        duration_minutes: 360,
        is_active: true,
        features: ['Class-H industrial suction units', 'Silicon residue and adhesive removal', 'Full environmental clearance badge'],
      },
      {
        id: srv4Id,
        title: 'Carpet & Upholstery Deep Extraction',
        description: 'High-temperature hot water extraction with antimicrobial pre-treatment and stain-guard protective seal.',
        base_price: 190.00,
        category: 'Carpet & Upholstery',
        duration_minutes: 120,
        is_active: true,
        features: ['190°F pressurized water extraction', 'Fast-dry turbo airflow fans', 'Pet allergen neutralizer'],
      },
    ]);

    // 5. Initial Service Orders
    const ord1Id = '77777777-7777-4777-8777-777777777771';
    const ord2Id = '77777777-7777-4777-8777-777777777772';
    const ord3Id = '77777777-7777-4777-8777-777777777773';

    await (adminClient as any).from('service_orders').upsert([
      {
        id: ord1Id,
        client_id: client1Id,
        operational_id: tech1Id,
        service_id: srv1Id,
        status: 'in_progress',
        scheduled_date: new Date(Date.now() + 3600000).toISOString(),
        total_price: 450.00,
        address: '742 Evergreen Plaza, Suite 400, Financial District',
        notes: 'Security check-in at front desk. Access badge code: #8839.',
        checklist: [
          { id: 'chk-1', task: 'HVAC Air intake pre-filter inspection', completed: true, completed_by: 'Marcus Vance', timestamp: '09:15 AM' },
          { id: 'chk-2', task: 'Executive conference room surface fogging', completed: true, completed_by: 'Marcus Vance', timestamp: '09:45 AM' },
          { id: 'chk-3', task: 'Cafeteria & kitchenette grease extraction', completed: false },
          { id: 'chk-4', task: 'Final ATP bio-luminescence swab verification', completed: false }
        ],
        inspection_photos: [
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500',
          'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=500'
        ],
      },
      {
        id: ord2Id,
        client_id: client2Id,
        operational_id: null,
        service_id: srv2Id,
        status: 'pending',
        scheduled_date: new Date(Date.now() + 86400000).toISOString(),
        total_price: 280.00,
        address: '1040 Innovation Way, Building C, Technology Park',
        notes: 'Deep sanitization before VIP board visit.',
        checklist: [
          { id: 'chk-201', task: 'Safety hazard & floor hazard assessment', completed: false },
          { id: 'chk-202', task: 'Sanitization of laboratory workspace benches', completed: false },
          { id: 'chk-203', task: 'Client acceptance inspection and sign-off', completed: false }
        ],
        inspection_photos: [],
      },
      {
        id: ord3Id,
        client_id: client1Id,
        operational_id: tech2Id,
        service_id: srv3Id,
        status: 'completed',
        scheduled_date: new Date(Date.now() - 86400000).toISOString(),
        total_price: 650.00,
        address: '400 Grand Ave, Penthouse A',
        notes: 'Post-renovation fine dust vacuuming complete.',
        client_signature_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300',
        checklist: [
          { id: 'chk-301', task: 'Coarse drywall & construction debris collection', completed: true, completed_by: 'Elena Rostova', timestamp: '01:20 PM' },
          { id: 'chk-302', task: 'HEPA sealed fine dust extraction', completed: true, completed_by: 'Elena Rostova', timestamp: '02:45 PM' },
          { id: 'chk-303', task: 'Glass polish and client sign-off audit', completed: true, completed_by: 'Elena Rostova', timestamp: '04:10 PM' }
        ],
        inspection_photos: [
          'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500',
          'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=500'
        ]
      }
    ]);

    // 6. Initial Support Ticket & SAC Chat
    const tktId = '88888888-8888-4888-8888-888888888881';
    await (adminClient as any).from('support_tickets').upsert([
      {
        id: tktId,
        client_id: client1Id,
        assigned_to: adminId,
        service_order_id: ord1Id,
        subject: 'Request for additional bio-swab report certification',
        category: 'Audit & Compliance',
        status: 'in_progress',
        priority: 'high',
        resolution_notes: 'Preparing formal ATP laboratory report with timestamp proof.',
      }
    ]);

    await (adminClient as any).from('chat_messages').upsert([
      {
        id: '99999999-9999-4999-9999-999999999991',
        ticket_id: tktId,
        sender_id: client1Id,
        message: 'Hello Support, we need the official ATP laboratory certificate for our building audit review tomorrow morning.',
        is_internal_note: false,
      },
      {
        id: '99999999-9999-4999-9999-999999999992',
        ticket_id: tktId,
        sender_id: adminId,
        message: 'Internal Staff Memo: Marcus has recorded swabs 1 and 2. Once squad finishes kitchenette, we can export the digital report.',
        is_internal_note: true,
      },
      {
        id: '99999999-9999-4999-9999-999999999993',
        ticket_id: tktId,
        sender_id: adminId,
        message: 'Greetings! Our field squad is currently finishing the on-site sanitization. The certificate with time-stamped inspection photos will be dispatched shortly.',
        is_internal_note: false,
      }
    ]);

    return NextResponse.json({
      success: true,
      message: 'Supabase database tables successfully seeded with initial production ecosystem records.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
