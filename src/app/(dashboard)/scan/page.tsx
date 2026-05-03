import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScannerCard from './ScannerCard'

export const dynamic = 'force-dynamic'

export default async function ScanPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <ScannerCard />
}
