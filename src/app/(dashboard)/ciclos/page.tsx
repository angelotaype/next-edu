import { createClient } from '@/lib/supabase/server'
import CicloForm from './CicloForm'
import CiclosTable from './CiclosTable'
import type { CycleRow } from './types'

export const dynamic = 'force-dynamic'

async function getCycles() {
  const supabase = createClient()
  const db = supabase as any

  const { data, error } = await db
    .from('cycles')
    .select('id, school_id, name, ano, fecha_inicio, fecha_fin, estado, created_at, updated_at')
    .order('ano', { ascending: false })
    .order('fecha_inicio', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as CycleRow[]
}

export default async function CiclosPage() {
  const cycles = await getCycles()
  const activeCount = cycles.filter((cycle) => cycle.estado === 'activo').length

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-7 md:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                Gestión académica
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Ciclos</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
                Define periodos académicos, controla su estado y organiza la base operativa del colegio.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-gray-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">Activos</p>
                <p className="mt-1 text-sm font-semibold text-gray-700">{activeCount} de {cycles.length || 0}</p>
              </div>
              <CicloForm triggerLabel="Nuevo ciclo" />
            </div>
          </div>
        </div>
      </div>

      <CiclosTable cycles={cycles} />
    </div>
  )
}
