'use client'

import CicloForm from './CicloForm'
import DeleteCicloButton from './DeleteCicloButton'
import type { CycleRow } from './types'

interface CiclosTableProps {
  cycles: CycleRow[]
}

function getEstado(cycle: CycleRow): CycleRow['deleted_at'] extends string | null ? 'activo' | 'inactivo' : never {
  return cycle.deleted_at ? 'inactivo' : 'activo'
}

function getYearLabel(cycle: CycleRow) {
  if (cycle.start_date) {
    return new Date(`${cycle.start_date}T00:00:00`).getFullYear().toString()
  }

  if (cycle.end_date) {
    return new Date(`${cycle.end_date}T00:00:00`).getFullYear().toString()
  }

  return '—'
}

function formatDate(date: string | null) {
  if (!date) return '—'

  return new Date(`${date}T00:00:00`).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function EstadoBadge({ estado }: { estado: 'activo' | 'inactivo' }) {
  const className = estado === 'activo'
    ? 'border border-green-200 bg-green-50 text-green-700'
    : 'border border-gray-200 bg-gray-50 text-gray-600'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${className}`}>
      {estado}
    </span>
  )
}

export default function CiclosTable({ cycles }: CiclosTableProps) {
  if (cycles.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-gray-900">No hay ciclos aún.</h2>
        <p className="mt-2 text-sm text-gray-500">Crea uno para empezar.</p>

        <div className="mt-6 flex justify-center">
          <CicloForm triggerLabel="Crear primer ciclo" />
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-4 md:px-5">
        <h2 className="text-sm font-semibold text-gray-900 md:text-base">Ciclos registrados</h2>
        <p className="mt-1 text-sm text-gray-500">Gestiona periodos académicos y define su estado operativo.</p>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {cycles.map((cycle) => (
          <article key={cycle.id} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{cycle.name}</p>
                <p className="mt-1 text-xs text-gray-500">Año {getYearLabel(cycle)}</p>
              </div>
              <EstadoBadge estado={getEstado(cycle)} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">Inicio</p>
                <p className="mt-1 text-gray-700">{formatDate(cycle.start_date)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">Fin</p>
                <p className="mt-1 text-gray-700">{formatDate(cycle.end_date)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <CicloForm cycle={cycle} triggerLabel="Editar" triggerVariant="secondary" />
              <DeleteCicloButton cycleId={cycle.id} cycleName={cycle.name} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Nombre</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Año</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Inicio</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Fin</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Estado</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {cycles.map((cycle) => (
              <tr key={cycle.id} className="transition-colors hover:bg-gray-50/70">
                <td className="px-5 py-4 font-semibold text-gray-900">{cycle.name}</td>
                <td className="px-5 py-4 text-gray-700">{getYearLabel(cycle)}</td>
                <td className="px-5 py-4 text-gray-600">{formatDate(cycle.start_date)}</td>
                <td className="px-5 py-4 text-gray-600">{formatDate(cycle.end_date)}</td>
                <td className="px-5 py-4"><EstadoBadge estado={getEstado(cycle)} /></td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <CicloForm cycle={cycle} triggerLabel="Editar" triggerVariant="secondary" />
                    <DeleteCicloButton cycleId={cycle.id} cycleName={cycle.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
