'use client'

import { useRef, useState } from 'react'
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
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  async function loadHtml2Pdf() {
    const module = await import('html2pdf.js')
    return module.default as any
  }

  if (!studentCode || !qrValue) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
        <p className="text-sm font-medium text-gray-900">Este estudiante aún no tiene código asignado.</p>
        <p className="mt-1 text-sm text-gray-500">Cuando exista un código, el carnet QR aparecerá aquí.</p>
      </div>
    )
  }

  async function handleDownloadPdf() {
    if (!cardRef.current || isExporting) return

    setIsExporting(true)

    try {
      const html2pdf = await loadHtml2Pdf()

      await html2pdf()
        .set({
          margin: 0.4,
          filename: `${studentCode}-carnet.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        })
        .from(cardRef.current)
        .save()
    } finally {
      setIsExporting(false)
    }
  }

  function handlePrint() {
    if (!cardRef.current || isExporting) return

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>${studentCode} - Carnet</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; background: #f8fafc; }
            .card-wrap { max-width: 420px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="card-wrap">${cardRef.current.outerHTML}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
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
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? 'Generando PDF...' : '📥 Descargar PDF'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isExporting}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center rounded-3xl border border-blue-100 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] p-6 shadow-sm">
        <div
          ref={cardRef}
          className="rounded-3xl border border-white bg-white p-5 shadow-[0_24px_60px_-32px_rgba(37,99,235,0.45)]"
        >
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Next Edu</p>
          <p className="text-center text-lg font-bold text-gray-900">{studentName}</p>
          <p className="mb-4 text-center font-mono text-sm text-gray-500">{studentCode}</p>
          <QRCodeSVG value={qrValue} size={220} bgColor="#FFFFFF" fgColor="#0F172A" includeMargin />
        </div>
      </div>
    </div>
  )
}
