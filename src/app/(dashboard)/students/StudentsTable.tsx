'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface StudentRow {
  id: string
  code: string
  nombres: string
  apellidos: string
  photoUrl: string | null
  estadoMatricula: string
  classroomId: string | null
  classroomName: string | null
  cycleId: string | null
  cycleName: string | null
  debtAmount: number
  debtStatus: string
}

interface Props {
  rows: StudentRow[]
  cycles: { id: string; name: string }[]
  classrooms: { id: string; name: string }[]
}

const DEBT_BADGE: Record<string, { label: string; className: string }> = {
  al_dia: { label: 'Al día', className: 'bg-green-100 text-green-700' },
  parcial: { label: 'Parcial', className: 'bg-blue-100 text-blue-700' },
  moroso: { label: 'Moroso', className: 'bg-red-100 text-red-700' },
  vencido: { label: 'Vencido', className: 'bg-red-100 text-red-700' },
  pendiente: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
  sin_plan: { label: 'Sin plan', className: 'bg-gray-100 text-gray-600' },
}

function formatSoles(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function DebtBadge({ status }: { status: string }) {
  const s = DEBT_BADGE[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}

function initials(nombres: string, apellidos: string) {
  const a = (apellidos || '').trim()[0] ?? ''
  const n = (nombres || '').trim()[0] ?? ''
  return (a + n).toUpperCase() || '?'
}

export default function StudentsTable({ rows, cycles, classrooms }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')
  const [classroomFilter, setClassroomFilter] = useState('')
  const [debtFilter, setDebtFilter] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (cycleFilter && r.cycleId !== cycleFilter) return false
      if (classroomFilter && r.classroomId !== classroomFilter) return false
      if (debtFilter && r.debtStatus !== debtFilter) return false
      if (!q) return true
      const haystack = `${r.apellidos} ${r.nombres} ${r.code}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [rows, query, cycleFilter, classroomFilter, debtFilter])

  const visibleClassrooms = useMemo(() => {
    if (!cycleFilter) return classrooms
    const allowed = new Set(
      rows.filter((r) => r.cycleId === cycleFilter && r.classroomId).map((r) => r.classroomId!)
    )
    return classrooms.filter((c) => allowed.has(c.id))
  }, [classrooms, cycleFilter, rows])

  function clearFilters() {
    setQuery('')
    setCycleFilter('')
    setClassroomFilter('')
    setDebtFilter('')
  }

  const hasFilters = !!(query || cycleFilter || classroomFilter || debtFilter)

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, apellido o código…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
            <select
              value={cycleFilter}
              onChange={(e) => { setCycleFilter(e.target.value); setClassroomFilter('') }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los ciclos</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={classroomFilter}
              onChange={(e) => setClassroomFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los salones</option>
              {visibleClassrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={debtFilter}
              onChange={(e) => setDebtFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Cualquier deuda</option>
              <option value="al_dia">Al día</option>
              <option value="parcial">Parcial</option>
              <option value="pendiente">Pendiente</option>
              <option value="moroso">Moroso</option>
              <option value="vencido">Vencido</option>
              <option value="sin_plan">Sin plan</option>
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-800 underline whitespace-nowrap"
            >
              Limpiar
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-400">
          {filtered.length} de {rows.length} alumnos
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-400 mb-3">
              {rows.length === 0
                ? 'Aún no hay alumnos matriculados.'
                : 'Sin resultados con esos filtros.'}
            </p>
            {rows.length === 0 && (
              <a
                href="/students/nuevo"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                Registrar primer alumno →
              </a>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Alumno</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Ciclo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Salón</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Deuda</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/students/${r.id}`)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {r.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.photoUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-gray-100"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {initials(r.nombres, r.apellidos)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {r.apellidos}, {r.nombres}
                          </p>
                          <p className="text-xs text-gray-400 sm:hidden truncate">{r.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs hidden sm:table-cell">{r.code}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{r.cycleName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.classroomName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-gray-700">
                          {formatSoles(r.debtAmount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><DebtBadge status={r.debtStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
