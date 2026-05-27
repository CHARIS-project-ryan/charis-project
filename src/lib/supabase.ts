import { createClient } from '@supabase/supabase-js'
import { debugLog, debugWarn } from '@/lib/debug'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  debugWarn(
    'supabase',
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — add to .env',
  )
} else {
  debugLog('supabase', 'client config', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.slice(0, 20) + '…',
  })
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
)
