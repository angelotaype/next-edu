'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold tracking-tight">Ocurrió un error inesperado</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              La aplicación no pudo completar la solicitud. Puedes intentar nuevamente o volver al inicio.
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
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98]"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
