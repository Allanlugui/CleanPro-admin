import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let serverAdminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (serverAdminClient) {
    return serverAdminClient;
  }

  const keyToUse = serviceRoleKey || anonKey;
  if (!supabaseUrl || !keyToUse || supabaseUrl.includes('your-project')) {
    return null;
  }

  serverAdminClient = createClient(supabaseUrl, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverAdminClient;
}
