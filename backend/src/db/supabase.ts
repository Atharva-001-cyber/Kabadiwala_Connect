import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is always loaded reliably
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    supabaseKey &&
    supabaseKey.length > 20
  );
};

// Node.js 18 fallback for Supabase realtime client transport
class NodeWebSocketShim {}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      realtime: {
        transport: (typeof WebSocket !== 'undefined' ? WebSocket : NodeWebSocketShim) as any
      }
    })
  : null;

if (isSupabaseConfigured()) {
  console.log('⚡ [SUPABASE] Initialized cloud client for:', supabaseUrl);
} else {
  console.log('ℹ️  [SUPABASE] Credentials not provided; operating in local JSON store mode.');
}

