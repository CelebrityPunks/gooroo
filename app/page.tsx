import { redirect } from 'next/navigation';
import { AUTH_ENABLED } from '../lib/config';
import { createClient } from '../lib/supabaseServer';

export default async function Home() {
  if (!AUTH_ENABLED) {
    redirect('/meditate');
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/marketing');
  }
}
