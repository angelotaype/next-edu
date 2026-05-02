'use client'

import { format } from 'date-fns'

export interface AttendanceRow {
  id: string
  dateLabel: string | null
  checkIn: string | null
  checkOut: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'

  return format(parsed, 'dd/MM/yyyy HH:mm')
}

function formatDateOnly(value: string | null) {
  if (!value) return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'

  return format(parsed, 'dd/MM/yyyy')
}

export default function AttendanceTab({ attendances }: { attendances: AttendanceRow[] }) {
  if (attendances.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
        <p className="text-sm font-medium text-gray-900">No hay registros de asistencia aún.</p>
        <p className="mt-1 text-sm text-gray-500">El historial aparecerá aquí cuando el alumno empiece a marcar entradas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 md:hidden">
        {attendances.map((attendance) => (
          <div key={attendance.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Fecha</p>
            <p className="mt-1 text-base font-semibold text-gray-900">{formatDateOnly(attendance.dateLabel)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Check in</p>
                <p className="font-medium text-gray-700">{formatDateTime(attendance.checkIn)}</p>
              </div>
              <div>
                <p className="text-gray-400">Check out</p>
                <p className="font-medium text-gray-700">{formatDateTime(attendance.checkOut)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Check in</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Check out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attendances.map((attendance) => (
              <tr key={attendance.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatDateOnly(attendance.dateLabel)}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{formatDateTime(attendance.checkIn)}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{formatDateTime(attendance.checkOut)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
