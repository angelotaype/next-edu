'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

export interface MorosoRow {
  studentId: string
  fullName: string
  cycleName: string | null
  classroomName: string | null
  debtTotal: number
  lastPaymentAt: string | null
  dueDate: string | null
  daysLate: number
  state: 'VENCIDO' | 'POR_VENCER'
  paymentStatus: string
  overdueDebt: number
}

type FilterValue = 'todos' | 'vencido' | 'por_vencer'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'

  return parsed.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function stateClasses(state: MorosoRow['state']) {
  return state === 'VENCIDO'
    ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
}

function dueText(row: MorosoRow) {
  return row.state === 'VENCIDO' ? `${row.daysLate} días vencido` : row.paymentStatus
}

export default function MorososTable({ rows }: { rows: MorosoRow[] }) {
  const [filter, setFilter] = useState<FilterValue>('todos')

  const filteredRows = useMemo(() => {
    if (filter === 'todos') return rows
    if (filter === 'vencido') return rows.filter((row) => row.state === 'VENCIDO')
    return rows.filter((row) => row.state === 'POR_VENCER')
  }, [filter, rows])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Seguimiento de morosidad</p>
          <p className="text-sm text-gray-500">Filtra alumnos con deuda vencida o por vencer.</p>
        </div>
        <div className="flex min-h-11 flex-wrap gap-2">
          {[
            ['todos', 'Todos'],
            ['vencido', 'Vencidos'],
            ['por_vencer', 'Por vencer'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as FilterValue)}
              className={[
                'min-h-11 rounded-xl px-4 text-sm font-medium transition active:scale-[0.98]',
                filter === value ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">No hay alumnos en este estado.</p>
          <p className="mt-1 text-sm text-gray-500">Cuando aparezcan cuotas pendientes, se mostrarán aquí.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredRows.map((row) => (
              <div key={row.studentId} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{row.fullName}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {row.cycleName ?? 'Sin ciclo'} • {row.classroomName ?? 'Sin salón'}
                    </p>
                  </div>
                  <span className={['rounded-full px-2.5 py-1 text-xs font-medium', stateClasses(row.state)].join(' ')}>
                    {row.state}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Deuda total</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(row.debtTotal)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Último pago</p>
                    <p className="font-medium text-gray-700">{formatDate(row.lastPaymentAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Vencimiento</p>
                    <p className="font-medium text-gray-700">{formatDate(row.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Estado</p>
                    <p className="font-medium text-gray-700">{dueText(row)}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/students/${row.studentId}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:border-gray-300"
                  >
                    Ver detalle
                  </Link>
                  <Link
                    href={`/students/${row.studentId}?tab=payments`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Pago rápido
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Alumno</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Ciclo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Salón</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Deuda</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Último pago</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Días vencido</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((row) => (
                  <tr key={row.studentId} className="hover:bg-gray-50/80">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{row.fullName}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{row.cycleName ?? '—'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{row.classroomName ?? '—'}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">{formatCurrency(row.debtTotal)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{formatDate(row.lastPaymentAt)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{dueText(row)}</td>
                    <td className="px-4 py-4">
                      <span className={['rounded-full px-2.5 py-1 text-xs font-medium', stateClasses(row.state)].join(' ')}>
                        {row.state}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/students/${row.studentId}`}
                          className="inline-flex min-h-11 items-center rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 transition hover:border-gray-300"
                        >
                          Ver detalle
                        </Link>
                        <Link
                          href={`/students/${row.studentId}?tab=payments`}
                          className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          Pago rápido
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
