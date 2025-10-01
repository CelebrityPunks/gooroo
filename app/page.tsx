import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabaseServer';

export default async function Home() {
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