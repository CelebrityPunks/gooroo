import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
  const cookieStore = cookies();
  const { url, key } = resolveSupabaseCredentials();

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        } catch {
          // The `remove` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
