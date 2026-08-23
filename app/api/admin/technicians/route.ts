import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return NextResponse.json(
      { error: 'Supabase is not configured. Please provide NEXT_PUBLIC_SUPABASE_URL and keys.' },
      { status: 500 }
    );
  }

  try {
    const { data: technicians, error } = await (adminClient as any)
      .from('profiles')
      .select('*')
      .eq('full_type', 'operational')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ technicians });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return NextResponse.json(
      { error: 'Supabase is not configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { email, password, full_name, phone, company_name } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required to provision an operational technician.' },
        { status: 400 }
      );
    }

    // 1. Try to create the Auth user via Supabase Admin API
    let newUserId: string | null = null;
    let authCreated = false;

    if (adminClient.auth && (adminClient.auth as any).admin) {
      const { data: authUser, error: authError } = await (adminClient.auth as any).admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          full_type: 'operational',
          phone: phone || null,
          company_name: company_name || null,
        },
      });

      if (authError) {
        if (!authError.message.includes('already exists') && !authError.message.includes('unique')) {
          return NextResponse.json({ error: authError.message }, { status: 400 });
        }
      } else if (authUser?.user) {
        newUserId = authUser.user.id;
        authCreated = true;
      }
    }

    // 2. If Auth admin API wasn't available or we have user ID, insert or upsert profile
    if (!newUserId) {
      const { data: generatedUuid } = await (adminClient as any).rpc('gen_random_uuid');
      newUserId = generatedUuid || crypto.randomUUID();
    }

    const { data: profile, error: profileError } = await (adminClient as any)
      .from('profiles')
      .upsert([
        {
          id: newUserId,
          email,
          full_name,
          full_type: 'operational',
          phone: phone || null,
          company_name: company_name || 'CleanOps Field Squad',
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      technician: profile,
      authCreated,
      message: 'Operational technician provisioned successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { id, full_name, phone, company_name, avatar_url, email } = body;

    if (!id) {
      return NextResponse.json({ error: 'Technician ID is required.' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (company_name !== undefined) updates.company_name = company_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (email !== undefined) updates.email = email;

    const { data: updatedProfile, error } = await (adminClient as any)
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .eq('full_type', 'operational')
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, technician: updatedProfile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Technician ID is required.' }, { status: 400 });
    }

    // 1. Unassign technician from active orders first (set operational_id = null)
    await (adminClient as any)
      .from('service_orders')
      .update({ operational_id: null, status: 'pending' })
      .eq('operational_id', id);

    // 2. Delete profile from profiles table
    const { error: profileDeleteError } = await (adminClient as any)
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileDeleteError) {
      return NextResponse.json({ error: profileDeleteError.message }, { status: 400 });
    }

    // 3. Delete from Supabase Auth if admin client has privileges
    if (adminClient.auth && (adminClient.auth as any).admin) {
      try {
        await (adminClient.auth as any).admin.deleteUser(id);
      } catch (authErr) {
        console.warn('Auth user deletion skipped or failed:', authErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Technician deleted successfully.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
