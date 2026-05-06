import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkotbctgfzyaszgvrfep.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrb3RiY3RnZnp5YXN6Z3ZyZmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjc4NzEsImV4cCI6MjA5MjgwMzg3MX0.nJhynoTYQ5adDwaqmRLxXJkKB3Z69_A_DAP_Z9YIPIs'

function getServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!value) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY')
  }
  return value
}

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export function createServiceClient() {
  const cookieStore = cookies()
  const serviceRoleKey = getServiceRoleKey()

  return createServerClient<Database>(
    SUPABASE_URL,
    serviceRoleKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
