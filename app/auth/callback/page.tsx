import React from 'react';
import { createClient } from '../../../lib/supabaseServer';
import { redirect } from 'next/navigation';

export default async function AuthCallbackPage() {
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
