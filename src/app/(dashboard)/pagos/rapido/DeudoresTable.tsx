'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import QuickPaymentModal from '@/components/payments/QuickPaymentModal'

export interface DeudorRow {
  id: string
  code: string | null
  documento: string | null
  fullName: string
  photoUrl: string | null
  cycleName: string | null
  classroomName: string | null
  debtTotal: number
  overdueDebt: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value)
}

function initials(name: string) {
  const parts = name.split(/[\s,]+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'NE'
}

export default function DeudoresTable({ rows }: { rows: DeudorRow[] }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<DeudorRow | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows

    return rows.filter((row) => {
      const haystack = `${row.fullName} ${row.code ?? ''} ${row.documento ?? ''}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [query, rows])

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, código o DNI..."
            className="min-h-12 w-full rounded-xl border border-gray-300 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="mt-3 text-xs text-gray-400">{filtered.length} alumnos con deuda</p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">No se encontraron alumnos con ese criterio.</p>
          <p className="mt-1 text-sm text-gray-500">Prueba con nombre, código o documento.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <div key={row.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  {row.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover bg-gray-100" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {initials(row.fullName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-gray-900">{row.fullName}</p>
                    <p className="mt-1 text-sm text-gray-500">{row.code ?? '—'} {row.documento ? `• ${row.documento}` : ''}</p>
                    <p className="mt-1 text-sm text-gray-500">{row.cycleName ?? 'Sin ciclo'} • {row.classroomName ?? 'Sin salón'}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-gray-400">Deuda total</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(row.debtTotal)}</p>
                  </div>
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                    <p className="text-red-500">Deuda vencida</p>
                    <p className="mt-1 font-semibold text-red-700">{formatCurrency(row.overdueDebt)}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/students/${row.id}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:border-gray-300"
                  >
                    Ver detalle
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelected(row)}
                    className="min-h-11 flex-1 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Pago rápido
                  </button>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Deuda total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Deuda vencida</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {row.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover bg-gray-100" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {initials(row.fullName)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{row.fullName}</p>
                          <p className="text-xs text-gray-500">{row.code ?? '—'} {row.documento ? `• ${row.documento}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{row.cycleName ?? '—'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{row.classroomName ?? '—'}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">{formatCurrency(row.debtTotal)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-red-700">{formatCurrency(row.overdueDebt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/students/${row.id}`}
                          className="inline-flex min-h-11 items-center rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 transition hover:border-gray-300"
                        >
                          Ver detalle
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelected(row)}
                          className="min-h-11 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          Pago rápido
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <QuickPaymentModal
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        student={
          selected
            ? {
                id: selected.id,
                fullName: selected.fullName,
                debtAmount: selected.debtTotal,
                overdueAmount: selected.overdueDebt,
              }
            : null
        }
        onPaid={() => window.location.reload()}
      />
    </div>
  )
}
