'use client'

import { useEffect, useMemo, useState } from 'react'
import QuickPaymentModal from '@/components/payments/QuickPaymentModal'

export interface AlumnoRow {
  id: string
  code: string | null
  dni: string | null
  fullName: string
  photoUrl: string | null
  cycleName: string | null
  classroomName: string | null
  debtTotal: number
  overdueDebt: number
  paymentStatus: string
  pendingInstallments: number
  nextInstallmentAmount: number
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

function statusForRow(row: AlumnoRow) {
  if (row.paymentStatus === 'Al día' || row.debtTotal <= 0) {
    return { label: 'Al día', icon: '🟢', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' }
  }

  if (row.paymentStatus === 'En riesgo' || row.overdueDebt > 0) {
    return { label: 'En riesgo', icon: '🔴', className: 'bg-red-50 text-red-700 ring-1 ring-red-200' }
  }

  return { label: 'Debe pagar', icon: '🟡', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' }
}

export default function AlumnosTable({
  rows,
  selectedStudentId,
}: {
  rows: AlumnoRow[]
  selectedStudentId?: string | null
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<AlumnoRow | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows

    return rows.filter((row) => {
      const haystack = `${row.fullName} ${row.code ?? ''} ${row.dni ?? ''}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [query, rows])

  useEffect(() => {
    if (!selectedStudentId) return

    const matched = rows.find((row) => row.id === selectedStudentId) ?? null
    if (matched) {
      setSelected(matched)
      setQuery(matched.fullName)
    }
  }, [rows, selectedStudentId])

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
        <p className="mt-3 text-xs text-gray-400">{filtered.length} alumnos cargados</p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">No se encontraron alumnos con ese criterio.</p>
          <p className="mt-1 text-sm text-gray-500">Prueba con nombre, código o DNI.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((row) => {
              const status = statusForRow(row)
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelected(row)}
                  className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-gray-300"
                >
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
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-base font-semibold text-gray-900">{row.fullName}</p>
                        <span className={['rounded-full px-2.5 py-1 text-xs font-medium', status.className].join(' ')}>
                          {status.icon} {status.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{row.code ?? '—'} {row.dni ? `• ${row.dni}` : ''}</p>
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
                </button>
              )
            })}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Alumno</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Ciclo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Salón</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Deuda total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Deuda vencida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => {
                  const status = statusForRow(row)
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className="cursor-pointer hover:bg-gray-50/80"
                    >
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
                            <p className="text-xs text-gray-500">{row.code ?? '—'} {row.dni ? `• ${row.dni}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{row.cycleName ?? '—'}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{row.classroomName ?? '—'}</td>
                      <td className="px-4 py-4">
                        <span className={['rounded-full px-2.5 py-1 text-xs font-medium', status.className].join(' ')}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">{formatCurrency(row.debtTotal)}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-red-700">{formatCurrency(row.overdueDebt)}</td>
                    </tr>
                  )
                })}
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
                pendingInstallments: selected.pendingInstallments,
                nextInstallmentAmount: selected.nextInstallmentAmount,
                paymentStatus: selected.paymentStatus,
              }
            : null
        }
        onPaid={() => window.location.reload()}
      />
    </div>
  )
}
