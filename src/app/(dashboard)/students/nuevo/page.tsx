import { createClient } from '@/lib/supabase/server'
import WizardForm from './WizardForm'

export const dynamic = 'force-dynamic'

async function getWizardData() {
  const supabase = createClient()
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Sesión no válida.')
  }

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const schoolId = (profile as { school_id?: string } | null)?.school_id

  if (profileError || !schoolId) {
    throw new Error('No se pudo resolver el colegio actual.')
  }

  const [cyclesRes, classroomsRes] = await Promise.all([
    db
      .from('cycles')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('estado', 'activo')
      .is('deleted_at', null)
      .order('start_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    db
      .from('classrooms')
      .select('id, name, cycle_id, tipo, nivel')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('name', { ascending: true }),
  ])

  if (cyclesRes.error) throw new Error(cyclesRes.error.message)
  if (classroomsRes.error) throw new Error(classroomsRes.error.message)

  const cycles = ((cyclesRes.data ?? []) as any[]).map((cycle) => ({
    id: cycle.id as string,
    name: (cycle.name as string) ?? 'Sin nombre',
  }))

  const classrooms = ((classroomsRes.data ?? []) as any[]).map((classroom) => ({
    id: classroom.id as string,
    name: (classroom.name as string) ?? 'Sin nombre',
    cycle_id: classroom.cycle_id as string,
    tipo: (classroom.tipo as string | null) ?? null,
    nivel: (classroom.nivel as string | null) ?? null,
  }))

  return { cycles, classrooms }
}

export default async function NuevoStudentPage() {
  const { cycles, classrooms } = await getWizardData()

  return <WizardForm cycles={cycles} classrooms={classrooms} />
}
