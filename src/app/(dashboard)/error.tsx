'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/(dashboard)/error]', error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900">No se pudo cargar este módulo</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          La vista actual falló durante la carga. Puedes reintentar o volver al panel principal.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.98]"
          >
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98]"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    </main>
  )
}
