'use client'

import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
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
  al_dia:   { label: 'AL DÍA',   className: 'bg-green-500 text-white' },
  debe:     { label: 'DEBE',     className: 'bg-red-500 text-white' },
  vencido:  { label: 'VENCIDO',  className: 'bg-red-700 text-white' },
  parcial:  { label: 'PARCIAL',  className: 'bg-blue-500 text-white' },
  pendiente:{ label: 'PENDIENTE',className: 'bg-yellow-500 text-white' },
}

function formatSoles(n: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n)
}

export default function ScanPage() {
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [student, setStudent] = useState<StudentResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [manualCode, setManualCode] = useState('')
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
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function processQRToken(token: string) {
    if (!token.trim()) return
    setStatus('scanning')
    setStudent(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('fn_qr_scan_and_debt', {
        qr_token: token.trim(),
        source: 'web_scan',
        scanned_by: user.id,
        rate_limit_seconds: 30,
      })

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = Array.isArray(data) ? data[0] : data
      if (!result) throw new Error('Sin resultado')

      if (result.out_rate_limited) {
        setStatus('rate_limited')
        setErrorMsg('Escaneo reciente. Espera 30 segundos.')
        return
      }

      setStudent({
        student_id: result.out_student_id,
        student_code: result.out_student_code,
        nombres: result.out_nombres,
        apellidos: result.out_apellidos,
        photo_url: result.out_photo_url,
        debt_status: result.out_debt_status,
        debt_amount: result.out_debt_amount,
        debt_message: result.out_debt_message,
        scanned_at: result.out_scanned_at,
      })
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Código QR no válido o alumno no encontrado.')
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
  }

  const badge = student ? (DEBT_BADGE[student.debt_status] ?? { label: student.debt_status.toUpperCase(), className: 'bg-gray-500 text-white' }) : null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 max-w-2xl w-full mx-auto">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Escáner QR</h1>
            <p className="text-sm text-gray-500">Apunta la cámara al código QR del alumno</p>
          </div>

          {/* QR Viewport */}
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video mb-4 shadow-xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Blue corner frame overlay */}
            {status === 'scanning' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-56 h-56">
                  {/* Top-left */}
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#2563EB] rounded-tl-lg" />
                  {/* Top-right */}
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#2563EB] rounded-tr-lg" />
                  {/* Bottom-left */}
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#2563EB] rounded-bl-lg" />
                  {/* Bottom-right */}
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#2563EB] rounded-br-lg" />
                  {/* Scan line animation */}
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-500 opacity-70 animate-pulse" />
                </div>
              </div>
            )}

            {/* Success overlay */}
            {status === 'success' && (
              <div className="absolute inset-0 bg-green-900/40 flex items-center justify-center">
                <div className="bg-white/10 rounded-full p-4">
                  <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {(status === 'error' || status === 'rate_limited') && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 px-6">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white text-sm text-center">{errorMsg}</p>
              </div>
            )}

            {/* Idle state */}
            {status === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500 text-sm">Iniciando cámara...</p>
              </div>
            )}
          </div>

          {/* Manual input */}
          <form onSubmit={handleManualSubmit} className="flex gap-2 mb-6">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ingresar código QR manualmente..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Buscar
            </button>
          </form>

          {/* Student result card */}
          {student && status === 'success' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
              <div className="flex items-center gap-4">
                {/* Photo */}
                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-gray-200">
                  {student.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={student.photo_url} alt={student.nombres} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50">
                      <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-base truncate">
                    {student.apellidos}, {student.nombres}
                  </p>
                  <p className="text-sm text-gray-500 font-mono">{student.student_code}</p>
                  {student.debt_amount > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">{student.debt_message} — {formatSoles(student.debt_amount)}</p>
                  )}
                </div>

                {/* Badge */}
                {badge && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex-shrink-0 ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Escaneado: {new Date(student.scanned_at).toLocaleTimeString('es-PE')}
                </p>
                <a href={`/students/${student.student_id}`}
                  className="text-xs text-blue-600 hover:underline font-medium">
                  Ver perfil →
                </a>
              </div>
            </div>
          )}

          {/* Next scan button */}
          {status === 'success' && (
            <button
              onClick={handleReset}
              className="w-full bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm"
            >
              Siguiente escaneo
            </button>
          )}

          {(status === 'error' || status === 'rate_limited') && (
            <button
              onClick={handleReset}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors"
            >
              Reintentar
            </button>
          )}

        </main>
      </div>
    </div>
  )
}
