'use client'

import { QRCodeSVG } from 'qrcode.react'

export default function CarnetTab({
  studentName,
  studentCode,
  qrValue,
}: {
  studentName: string
  studentCode: string | null
  qrValue: string | null
}) {
  if (!studentCode || !qrValue) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
        <p className="text-sm font-medium text-gray-900">Este estudiante aún no tiene código asignado.</p>
        <p className="mt-1 text-sm text-gray-500">Cuando exista un código, el carnet QR aparecerá aquí.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Carnet QR</p>
        <h3 className="mt-2 text-xl font-bold text-gray-900">Identificación lista para escaneo</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Usa este código para consultas rápidas de deuda y validación del alumno en control de acceso.
        </p>
        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-400">Alumno</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{studentName}</p>
          <p className="mt-4 text-sm text-gray-400">Código</p>
          <p className="mt-1 font-mono text-base font-semibold text-gray-800">{studentCode}</p>
        </div>
      </div>

      <div className="flex items-center justify-center rounded-3xl border border-blue-100 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] p-6 shadow-sm">
        <div className="rounded-3xl border border-white bg-white p-5 shadow-[0_24px_60px_-32px_rgba(37,99,235,0.45)]">
          <QRCodeSVG value={qrValue} size={220} bgColor="#FFFFFF" fgColor="#0F172A" includeMargin />
        </div>
      </div>
    </div>
  )
}
