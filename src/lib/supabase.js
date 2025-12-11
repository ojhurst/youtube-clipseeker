import { createClient } from '@supabase/supabase-js'

// Check if Supabase is configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only create client if configured
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = () => !!supabase

// Storage mode helper
export const getStorageMode = () => {
  return supabase ? 'supabase' : 'indexeddb'
}

console.log(`📦 Storage mode: ${getStorageMode()}`)

