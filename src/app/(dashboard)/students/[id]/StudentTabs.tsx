'use client'

import Link from 'next/link'
import * as Tabs from '@radix-ui/react-tabs'
import PaymentsTab, { type InstallmentRow } from './PaymentsTab'
import AttendanceTab, { type AttendanceRow } from './AttendanceTab'
import CarnetTab from './CarnetTab'

export interface StudentDetail {
  id: string
  fullName: string
  code: string | null
  cycleName: string | null
  classroomName: string | null
  status: string | null
  dni: string | null
  fechaNacimiento: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  qrToken: string | null
  apoderadoNombre: string | null
  apoderadoTelefono: string | null
  apoderadoEmail: string | null
  observaciones: string | null
}

interface StudentTabsProps {
  student: StudentDetail
  installments: InstallmentRow[]
  attendances: AttendanceRow[]
  initialTab?: 'info' | 'payments' | 'attendance' | 'card'
}

function statusClass(status: string | null) {
  switch (status) {
    case 'activo':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case 'retirado':
      return 'bg-red-50 text-red-700 ring-1 ring-red-200'
    default:
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
  }
}

function InfoGrid({ student }: { student: StudentDetail }) {
  const items = [
    { label: 'Nombre', value: student.fullName },
    { label: 'Código', value: student.code ?? '—' },
    { label: 'DNI', value: student.dni ?? '—' },
    { label: 'Fecha de nacimiento', value: student.fechaNacimiento ?? '—' },
    { label: 'Teléfono', value: student.telefono ?? '—' },
    { label: 'Email', value: student.email ?? '—' },
    { label: 'Dirección', value: student.direccion ?? '—' },
    { label: 'Ciclo', value: student.cycleName ?? '—' },
    { label: 'Salón', value: student.classroomName ?? '—' },
    { label: 'Apoderado', value: student.apoderadoNombre ?? '—' },
    { label: 'Tel. apoderado', value: student.apoderadoTelefono ?? '—' },
    { label: 'Email apoderado', value: student.apoderadoEmail ?? '—' },
    { label: 'Observaciones', value: student.observaciones ?? '—' },
    { label: 'Estado', value: student.status ?? '—', pill: true },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{item.label}</p>
          {item.pill ? (
            <div className="mt-3">
              <span className={['rounded-full px-2.5 py-1 text-xs font-medium capitalize', statusClass(student.status)].join(' ')}>
                {item.value}
              </span>
            </div>
          ) : (
            <p className="mt-3 text-base font-semibold text-gray-900">{item.value}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default function StudentTabs({ student, installments, attendances, initialTab = 'info' }: StudentTabsProps) {
  return (
    <Tabs.Root defaultValue={initialTab} className="space-y-5">
      <Tabs.List className="flex min-h-11 w-full gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        {[
          ['info', 'Información'],
          ['payments', 'Pagos'],
          ['attendance', 'Asistencia'],
          ['card', 'Carnet QR'],
        ].map(([value, label]) => (
          <Tabs.Trigger
            key={value}
            value={value}
            className="min-h-11 whitespace-nowrap rounded-xl px-4 text-sm font-medium text-gray-600 transition data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            {label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="info" className="outline-none">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Información</p>
              <h2 className="mt-2 text-xl font-bold text-gray-900">Ficha general del estudiante</h2>
            </div>
            <Link
              href={`/students/${student.id}/edit`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Editar información
            </Link>
          </div>
          <InfoGrid student={student} />
        </div>
      </Tabs.Content>

      <Tabs.Content value="payments" className="outline-none">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Pagos</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">Cuotas e historial del plan</h2>
          </div>
          <PaymentsTab studentId={student.id} installments={installments} />
        </div>
      </Tabs.Content>

      <Tabs.Content value="attendance" className="outline-none">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Asistencia</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">Histórico de entradas y salidas</h2>
          </div>
          <AttendanceTab attendances={attendances} />
        </div>
      </Tabs.Content>

      <Tabs.Content value="card" className="outline-none">
        <CarnetTab studentName={student.fullName} studentCode={student.code} qrValue={student.qrToken ?? student.code} />
      </Tabs.Content>
    </Tabs.Root>
  )
}
