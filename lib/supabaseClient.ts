import { createBrowserClient } from '@supabase/ssr';

const FALLBACK_SUPABASE_URL = 'https://euxvibuahngxafdeoapn.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eHZpYnVhaG5neGFmZGVvYXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMTQ0OTcsImV4cCI6MjA3NDg5MDQ5N30.a2oKgUthw54GIbNOi8ku-1oEBli8a9gYufswRhmQDDk';

function resolveSupabaseCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials are not configured.');
  }

  return { url, key };
}

export function createClient() {
  const { url, key } = resolveSupabaseCredentials();
  return createBrowserClient(url, key);
}
