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

// Note: Do NOT create a service role client in the browser.
// Service role keys must never be exposed client-side. Perform any admin
// operations on a secure server/Edge Function and call them from the client.
