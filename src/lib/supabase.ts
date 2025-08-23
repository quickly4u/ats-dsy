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
  
  const { data, error } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle();
  
  if (error) {
    // 406 with PGRST116 happens when maybeSingle() still encounters an issue; treat as missing
    if ((error as any)?.code === 'PGRST116' || (error as any)?.message?.includes('Cannot coerce')) {
      return null;
    }
    console.error('Error fetching user company_id:', error);
    return null;
  }
  
  return data?.company_id || null;
};

// Note: Do NOT create a service role client in the browser.
// Service role keys must never be exposed client-side. Perform any admin
// operations on a secure server/Edge Function and call them from the client.
