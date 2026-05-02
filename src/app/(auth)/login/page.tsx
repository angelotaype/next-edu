'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const REMEMBER_EMAIL_KEY = 'next-edu:remember-email'

function SchoolMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-600 shadow-lg shadow-blue-950/15">
      <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332-.477-4.5 1.253"
        />
      </svg>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(REMEMBER_EMAIL_KEY)

    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      const message = 'Correo o contraseña incorrectos.'
      setError(message)
      toast.error('No se pudo iniciar sesión', {
        description: message,
      })
      setLoading(false)
      return
    }

    if (rememberMe) {
      window.localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim())
    } else {
      window.localStorage.removeItem(REMEMBER_EMAIL_KEY)
    }

    toast.success('Ingreso correcto', {
      description: 'Redirigiendo al panel principal.',
    })

    router.push('/dashboard')
    router.refresh()
  }

  function handleForgotPassword() {
    toast('Recuperación no disponible en el MVP', {
      description: 'Solicítala al administrador principal del colegio.',
    })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10"
        >
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-5 flex items-center gap-4">
                <SchoolMark />
                <div>
                  <p className="text-sm font-semibold text-blue-600">Next Edu</p>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">Acceso al sistema</h1>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-gray-500">
                Ingresa con tu cuenta institucional para gestionar matrícula, cobranza y asistencia.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.08, ease: 'easeOut' }}
              className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="admin@colegio.com"
                    className="min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Ingresa tu contraseña"
                    className="min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex min-h-11 items-center gap-3 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    Recordarme
                  </label>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="min-h-11 text-left text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline sm:text-right"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-700 bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Ingresando...
                    </>
                  ) : (
                    'Ingresar al panel'
                  )}
                </button>
              </form>
            </motion.div>

            <p className="mt-6 text-center text-xs text-gray-400">
              © 2026 Next Edu. Sistema de gestión escolar.
            </p>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.32, delay: 0.1, ease: 'easeOut' }}
          className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 lg:flex"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.26),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_28%)]" />
          <div className="absolute inset-y-10 left-10 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-sky-300/10 blur-3xl" />
          <div className="absolute right-16 top-16 h-40 w-40 rounded-full border border-white/10 bg-white/5 blur-2xl" />

          <div className="relative flex w-full flex-col justify-between p-10 text-white xl:p-14">
            <div className="max-w-md">
              <div className="mb-7 inline-flex rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-50 shadow-sm backdrop-blur-md">
                Plataforma de gestión escolar
              </div>

              <h2 className="max-w-md text-4xl font-bold tracking-tight leading-tight text-white">
                Controla pagos, asistencia y operación escolar desde un solo panel.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-blue-100/90">
                Reduce morosidad, detecta alertas tempranas y toma mejores decisiones todos los días.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/16 bg-white/12 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-md">
                <p className="text-base font-semibold text-white">Morosidad bajo control</p>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/88">
                  Identifica deuda vencida, prioriza casos críticos y registra pagos sin perder seguimiento.
                </p>
              </div>

              <div className="rounded-3xl border border-white/16 bg-white/12 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-md">
                <p className="text-base font-semibold text-white">Alertas de asistencia</p>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/88">
                  Detecta patrones de inasistencia a tiempo e intervén antes de que afecten al alumno.
                </p>
              </div>

              <div className="rounded-3xl border border-white/16 bg-white/12 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-md">
                <p className="text-base font-semibold text-white">Operación segura por colegio</p>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/88">
                  Cada institución trabaja en un entorno aislado, protegido y listo para operar desde el primer día.
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </main>
  )
}
