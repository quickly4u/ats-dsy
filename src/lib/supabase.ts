import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Ensure a single client across HMR reloads
const existing = (globalThis as any).__supabase__ as ReturnType<typeof createClient> | undefined
export const supabase = existing ?? (() => {
  const client = createClient(supabaseUrl, supabaseAnonKey)
  ;(globalThis as any).__supabase__ = client
  return client
})()

// Utility to get current user's company_id
export const getCurrentUserCompanyId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1) Try existing users row
  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle();

  if (userErr && (userErr as any)?.code !== 'PGRST116' && !(userErr as any)?.message?.includes('Cannot coerce')) {
    console.error('Error fetching user company_id:', userErr);
  }
  if (userRow?.company_id) return userRow.company_id as string;

  // 2) Try to infer from team_invitations (by auth_user_id)
  let inferredCompanyId: string | null = null;
  const { data: inviteByAuth } = await supabase
    .from('team_invitations')
    .select('company_id')
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (inviteByAuth?.company_id) inferredCompanyId = inviteByAuth.company_id as string;

  // 3) Try to infer from team_invitations (by email) if still not found
  if (!inferredCompanyId && user.email) {
    const { data: inviteByEmail } = await supabase
      .from('team_invitations')
      .select('company_id')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (inviteByEmail?.company_id) inferredCompanyId = inviteByEmail.company_id as string;
  }

  // 4) Try to infer from auth metadata company.slug
  if (!inferredCompanyId) {
    const md: any = user.user_metadata ?? {};
    const slug: string | undefined = md?.company?.slug;
    if (slug) {
      const { data: companyBySlug } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (companyBySlug?.id) inferredCompanyId = companyBySlug.id as string;
    }
  }

  // 5) Skip email domain inference - companies table has no domain column

  // 6) Final fallback: ensure profile via RPC which creates company/users row if missing
  if (!inferredCompanyId) {
    try {
      const { data: ensuredCompanyId, error: ensureErr } = await supabase.rpc('ensure_user_profile');
      if (!ensureErr && ensuredCompanyId) {
        inferredCompanyId = ensuredCompanyId as string;
      } else if (ensureErr) {
        console.error('ensure_user_profile RPC failed:', ensureErr);
        console.error('RPC error details:', JSON.stringify(ensureErr, null, 2));
      }
    } catch (e) {
      console.warn('ensure_user_profile RPC threw:', e);
    }
  }

  // 7) If we inferred a company, backfill users row for consistency
  if (inferredCompanyId) {
    const md: any = user.user_metadata ?? {};
    await supabase
      .from('users')
      .upsert({
        id: user.id,
        company_id: inferredCompanyId,
        email: user.email,
        first_name: md.firstName ?? md.first_name ?? '',
        last_name: md.lastName ?? md.last_name ?? '',
        phone: md.phone ?? null,
        is_active: true,
      });
  }

  return inferredCompanyId ?? null;
};

// Note: Do NOT create a service role client in the browser.
// Service role keys must never be exposed client-side. Perform any admin
// operations on a secure server/Edge Function and call them from the client.
