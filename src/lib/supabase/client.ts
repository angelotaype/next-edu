import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkotbctgfzyaszgvrfep.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrb3RiY3RnZnp5YXN6Z3ZyZmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjc4NzEsImV4cCI6MjA5MjgwMzg3MX0.nJhynoTYQ5adDwaqmRLxXJkKB3Z69_A_DAP_Z9YIPIs'

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}
