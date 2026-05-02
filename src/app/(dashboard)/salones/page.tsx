import { createClient } from '@/lib/supabase/server'
import SalonForm from './SalonForm'
import SalonesTable from './SalonesTable'
import type { ClassroomRow, CycleOption } from './types'

export const dynamic = 'force-dynamic'

async function getSalonesData() {
  const supabase = createClient()
  const db = supabase as any

  const [classroomsRes, cyclesRes] = await Promise.all([
    db
      .from('classrooms')
      .select(`
        id,
        school_id,
        name,
        cycle_id,
        tipo,
        nivel,
        created_at,
        updated_at,
        deleted_at,
        created_by,
        cycles ( id, name )
      `)
      .order('name', { ascending: true })
      .order('created_at', { ascending: false }),
    db
      .from('cycles')
      .select('id, name')
      .is('deleted_at', null)
      .order('start_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
  ])

  if (classroomsRes.error) {
    throw new Error(classroomsRes.error.message)
  }

  if (cyclesRes.error) {
    throw new Error(cyclesRes.error.message)
  }

  const classrooms = ((classroomsRes.data ?? []) as any[]).map((row) => ({
    id: row.id,
    school_id: row.school_id,
    name: row.name,
    cycle_id: row.cycle_id,
    tipo: row.tipo,
    nivel: row.nivel,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    created_by: row.created_by,
    cycle_name: row.cycles?.name ?? null,
  })) as ClassroomRow[]

  const cycles = (cyclesRes.data ?? []) as CycleOption[]

  return { classrooms, cycles }
}

export default async function SalonesPage() {
  const { classrooms, cycles } = await getSalonesData()
  const activeCount = classrooms.filter((classroom) => !classroom.deleted_at).length

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-7 md:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                Gestión académica
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Salones</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
                Organiza salones por ciclo, tipo y nivel con una vista operativa clara para secretaría y dirección.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-gray-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">Activos</p>
                <p className="mt-1 text-sm font-semibold text-gray-700">{activeCount} de {classrooms.length || 0}</p>
              </div>
              <SalonForm cycles={cycles} triggerLabel="Nuevo salón" />
            </div>
          </div>
        </div>
      </div>

      <SalonesTable classrooms={classrooms} cycles={cycles} />
    </div>
  )
}
