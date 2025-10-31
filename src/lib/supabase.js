import { createClient } from '@supabase/supabase-js'

// These values should be set in your environment variables
// For now, using placeholder values - you'll need to replace these with your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Check if credentials are configured
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL' || !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('⚠️ Supabase credentials not configured! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

