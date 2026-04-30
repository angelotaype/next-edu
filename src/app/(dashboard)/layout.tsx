import { redirect } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('school_id, full_name, role')
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRaw as any
  if (!profile?.school_id) {
    redirect('/login')
  }

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('name')
    .eq('id', profile.school_id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const school = schoolRaw as any

  return (
    <DashboardShell
      schoolName={school?.name ?? 'Next Edu'}
      userName={profile.full_name ?? user.email ?? 'Usuario'}
      userRole={profile.role ?? 'admin'}
    >
      {children}
    </DashboardShell>
  )
}
