import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://leitzamleuxgnqbwixis.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaXR6YW1sZXV4Z25xYndpeGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NjAzNjIsImV4cCI6MjEwNTIzNjM2Mn0.icZQWcNlU0XrmO2UoyRV0VZafEcO5wC9y4F0jzv_WO0';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);