import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm md:p-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 9a4 4 0 115.656 5.656L12 17.485l-2.828-2.829A4 4 0 119.172 9z"
            />
          </svg>
        </div>

        <p className="text-sm font-medium text-blue-600">Error 404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">La página no existe</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          La ruta solicitada no está disponible o fue movida. Regresa al panel para continuar trabajando.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.98]"
        >
          Volver al panel
        </Link>
      </div>
    </main>
  )
}
