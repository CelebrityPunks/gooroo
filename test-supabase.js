// Test script to verify Supabase client installation
// This file can be deleted after testing

import { createClient } from '@supabase/supabase-js';

// Test that we can create a client (with placeholder values)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created successfully');
  console.log('Supabase URL:', supabaseUrl);
} catch (error) {
  console.error('❌ Error creating Supabase client:', error);
}
