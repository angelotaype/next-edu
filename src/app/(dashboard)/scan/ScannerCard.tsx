'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import QuickPaymentModal from '@/components/payments/QuickPaymentModal'
import { createClient } from '@/lib/supabase/client'

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error' | 'rate_limited'

interface StudentResult {
  student_id: string
  student_code: string
  nombres: string
  apellidos: string
  photo_url: string | null
  debt_status: string
  debt_amount: number
  debt_message: string
  scanned_at: string
}

const DEBT_BADGE: Record<string, { label: string; className: string }> = {
  al_dia: { label: 'AL DÍA', className: 'bg-green-500 text-white' },
  debe: { label: 'DEBE', className: 'bg-red-500 text-white' },
  vencido: { label: 'VENCIDO', className: 'bg-red-700 text-white' },
  parcial: { label: 'PARCIAL', className: 'bg-blue-500 text-white' },
  pendiente: { label: 'PENDIENTE', className: 'bg-yellow-500 text-white' },
}

function formatSoles(n: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n)
}

function hasOverdueDebt(student: StudentResult | null) {
  if (!student) return false
  return student.debt_amount > 0 && ['debe', 'vencido', 'pendiente', 'parcial'].includes(student.debt_status)
}

export default function ScannerCard() {
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [student, setStudent] = useState<StudentResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setStatus('scanning')
    } catch {
      setStatus('error')
      setErrorMsg('No se pudo acceder a la cámara. Usa ingreso manual.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

async function processQRToken(token: string) {
    const normalizedToken = token.trim()
    if (!normalizedToken) return
    setStatus('scanning')
    setStudent(null)
    setErrorMsg('')

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    try {
      console.log('🔍 QR Code detected:', normalizedToken)

      const { data: studentRowRaw, error: studentError } = await supabase
        .from('students')
        .select('id, code, nombres, apellidos, photo_url')
        .eq('code', normalizedToken)
        .is('deleted_at', null)
        .single()

      const studentRow = studentRowRaw as {
        id: string
        code: string | null
        nombres: string | null
        apellidos: string | null
        photo_url: string | null
      } | null

      if (studentError || !studentRow) {
        throw new Error(studentError?.message ?? 'Alumno no encontrado con este código QR.')
      }

      const { data: debtSummary, error: debtError } = await supabase
        .from('student_debt_summary')
        .select('debt_amount, debt_status')
        .eq('student_id', studentRow.id)
        .maybeSingle()

      if (debtError) {
        throw new Error(debtError.message)
      }

      const debtAmount = Number((debtSummary as any)?.debt_amount) || 0
      const debtStatus = ((debtSummary as any)?.debt_status as string | undefined) ?? (debtAmount > 0 ? 'debe' : 'al_dia')
      const debtMessage = debtAmount > 0 ? 'Deuda pendiente detectada' : 'Alumno al día'
      const scannedAt = new Date().toISOString()

      console.log('📊 Student found:', studentRow)
      console.log('💰 Total due:', debtAmount)

      setStudent({
        student_id: studentRow.id as string,
        student_code: (studentRow.code as string | null) ?? normalizedToken,
        nombres: (studentRow.nombres as string | null) ?? '',
        apellidos: (studentRow.apellidos as string | null) ?? '',
        photo_url: (studentRow.photo_url as string | null) ?? null,
        debt_status: debtStatus,
        debt_amount: debtAmount,
        debt_message: debtMessage,
        scanned_at: scannedAt,
      })
      setStatus('success')
    } catch (error) {
      console.error('QR scan failed:', error)
      setStatus('error')
      setErrorMsg(error instanceof Error ? error.message : 'Código QR no válido o alumno no encontrado.')
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    processQRToken(manualCode)
    setManualCode('')
  }

  function handleReset() {
    setStatus('scanning')
    setStudent(null)
    setErrorMsg('')
    setPaymentOpen(false)
  }

  function handleAttendance() {
    toast.success('Asistencia registrada', {
      description: 'Puedes continuar con el siguiente alumno.',
    })
    handleReset()
  }

  const badge = student
    ? (DEBT_BADGE[student.debt_status] ?? { label: student.debt_status.toUpperCase(), className: 'bg-gray-500 text-white' })
    : null

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-7 md:py-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Control QR</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Escáner de asistencia</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
            Valida acceso, revisa deuda vencida y registra pagos rápidos sin salir del flujo de escaneo.
          </p>
        </div>
      </div>

      <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-2xl bg-black shadow-xl sm:aspect-video">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-44 w-44 sm:h-56 sm:w-56">
              <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-[#2563EB]" />
              <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-[#2563EB]" />
              <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-[#2563EB]" />
              <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-[#2563EB]" />
              <div className="absolute inset-x-0 top-1/2 h-0.5 animate-pulse bg-blue-500 opacity-70" />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-900/40">
            <div className="rounded-full bg-white/10 p-4">
              <svg className="h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {(status === 'error' || status === 'rate_limited') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-6">
            <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-center text-sm text-white">{errorMsg}</p>
          </div>
        )}

        {status === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-500">Iniciando cámara...</p>
          </div>
        )}
      </div>

      <form onSubmit={handleManualSubmit} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Ingresar código QR manualmente..."
          className="min-h-12 flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!manualCode.trim()}
          className="min-h-12 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300 sm:min-w-28"
        >
          Buscar
        </button>
      </form>

      {student && status === 'success' && (
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100">
              {student.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.photo_url} alt={student.nombres} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-50">
                  <svg className="h-8 w-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-gray-900">
                {student.apellidos}, {student.nombres}
              </p>
              <p className="font-mono text-sm text-gray-500">{student.student_code}</p>
              {student.debt_amount > 0 ? (
                <p className="mt-0.5 text-sm font-medium text-red-600">
                  {student.debt_message} — {formatSoles(student.debt_amount)}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-green-600">Sin deuda pendiente.</p>
              )}
            </div>

            {badge && (
              <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold tracking-wide ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleAttendance}
              className="min-h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-300 active:scale-[0.98]"
            >
              Registrar asistencia
            </button>

            {hasOverdueDebt(student) && (
              <button
                type="button"
                onClick={() => setPaymentOpen(true)}
                className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
              >
                Pago rápido
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-400">
              Escaneado: {new Date(student.scanned_at).toLocaleTimeString('es-PE')}
            </p>
            <Link href={`/students/${student.student_id}`} className="text-xs font-medium text-blue-600 hover:underline">
              Ver perfil →
            </Link>
          </div>
        </div>
      )}

      {status === 'success' && !student && (
        <button
          onClick={handleReset}
          className="w-full rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98]"
        >
          Siguiente escaneo
        </button>
      )}

      {(status === 'error' || status === 'rate_limited') && (
        <button
          onClick={handleReset}
          className="w-full rounded-xl bg-gray-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 active:scale-[0.98]"
        >
          Reintentar
        </button>
      )}

      <QuickPaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        student={
          student
            ? {
                id: student.student_id,
                fullName: `${student.apellidos}, ${student.nombres}`.trim().replace(/^,\s*/, ''),
                debtAmount: student.debt_amount,
                overdueAmount: student.debt_amount,
              }
            : null
        }
        onPaid={handleReset}
      />
    </div>
  )
}
