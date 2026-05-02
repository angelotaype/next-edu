'use client'

import DeleteSalonButton from './DeleteSalonButton'
import SalonForm from './SalonForm'
import type { ClassroomRow, CycleOption } from './types'

interface SalonesTableProps {
  classrooms: ClassroomRow[]
  cycles: CycleOption[]
}

function getEstado(classroom: ClassroomRow): 'activo' | 'inactivo' {
  return classroom.deleted_at ? 'inactivo' : 'activo'
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

export default function SalonesTable({ classrooms, cycles }: SalonesTableProps) {
  if (classrooms.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-gray-900">No hay salones aún.</h2>
        <p className="mt-2 text-sm text-gray-500">Crea uno para empezar.</p>

        <div className="mt-6 flex justify-center">
          <SalonForm cycles={cycles} triggerLabel="Crear primer salón" />
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-4 md:px-5">
        <h2 className="text-sm font-semibold text-gray-900 md:text-base">Salones registrados</h2>
        <p className="mt-1 text-sm text-gray-500">Gestiona salones por ciclo, tipo y nivel.</p>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {classrooms.map((classroom) => (
          <article key={classroom.id} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{classroom.name}</p>
                <p className="mt-1 text-xs text-gray-500">{classroom.tipo ?? '—'} · {classroom.nivel ?? '—'}</p>
              </div>
              <EstadoBadge estado={getEstado(classroom)} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">Ciclo</p>
                <p className="mt-1 text-gray-700">{classroom.cycle_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">Capacidad</p>
                <p className="mt-1 text-gray-700">{classroom.nivel ?? '—'}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <SalonForm cycles={cycles} classroom={classroom} triggerLabel="Editar" triggerVariant="secondary" />
              <DeleteSalonButton classroomId={classroom.id} classroomName={classroom.name} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Nombre</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Tipo</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Nivel</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Ciclo</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Estado</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {classrooms.map((classroom) => (
              <tr key={classroom.id} className="transition-colors hover:bg-gray-50/70">
                <td className="px-5 py-4 font-semibold text-gray-900">{classroom.name}</td>
                <td className="px-5 py-4 text-gray-700">{classroom.tipo ?? '—'}</td>
                <td className="px-5 py-4 text-gray-700">{classroom.nivel ?? '—'}</td>
                <td className="px-5 py-4 text-gray-600">{classroom.cycle_name ?? '—'}</td>
                <td className="px-5 py-4"><EstadoBadge estado={getEstado(classroom)} /></td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <SalonForm cycles={cycles} classroom={classroom} triggerLabel="Editar" triggerVariant="secondary" />
                    <DeleteSalonButton classroomId={classroom.id} classroomName={classroom.name} />
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
