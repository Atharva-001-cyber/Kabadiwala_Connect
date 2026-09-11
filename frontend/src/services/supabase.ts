import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://nmhuofuogqvfqaeoanac.supabase.co';
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taHVvZnVvZ3F2ZnFhZW9hbmFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTEzOTQ2NCwiZXhwIjoyMTA0NzE1NDY0fQ.svCmgdTYCiIvBFzB3u3tshuy4eodiobdKttbjVgii94';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage
  }
});

console.log('⚡ [SUPABASE CLIENT] Initialized direct cloud client for:', SUPABASE_URL);
