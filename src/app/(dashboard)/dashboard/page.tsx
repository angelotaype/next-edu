import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSoles(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  completado: { label: 'Completado', className: 'border border-green-200 bg-green-50 text-green-700' },
  completed: { label: 'Completado', className: 'border border-green-200 bg-green-50 text-green-700' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.className}`}>
      {s.label}
    </span>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 h-10 w-10 rounded-2xl bg-gray-100" />
            <div className="mb-3 h-3 w-24 rounded bg-gray-200" />
            <div className="mb-2 h-8 w-28 rounded bg-gray-200" />
            <div className="h-3 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 h-9 w-9 rounded-xl bg-gray-100" />
            <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
            <div className="h-3 w-32 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 h-4 w-40 rounded bg-gray-200" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 border-t border-gray-100 py-3 first:border-t-0">
            <div className="h-11 w-11 rounded-xl bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-gray-100" />
              <div className="h-3 w-20 rounded bg-gray-100" />
            </div>
            <div className="hidden w-24 rounded bg-gray-100 md:block" />
            <div className="h-6 w-16 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Data component ──────────────────────────────────────────────────────────

async function DashboardData() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('school_id, full_name, role')
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRaw as any
  if (!profile?.school_id) redirect('/login')

  const schoolId = profile.school_id as string

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  const [studentsRes, paymentsRes, attendanceRes, paymentPlansRes] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('payments')
      .select('id, payment_plan_id, amount, method, paid_at, deleted_at')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('paid_at', { ascending: false })
      .limit(50),
    supabase.from('attendance_logs').select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId).gte('scanned_at', todayStart).lt('scanned_at', tomorrowStart),
    supabase.from('payment_plans')
      .select('id, student_id')
      .eq('school_id', schoolId)
      .is('deleted_at', null),
  ])

  if (studentsRes.error) throw new Error(studentsRes.error.message)
  if (paymentsRes.error) throw new Error(paymentsRes.error.message)
  if (attendanceRes.error) throw new Error(attendanceRes.error.message)
  if (paymentPlansRes.error) throw new Error(paymentPlansRes.error.message)

  const studentCount = studentsRes.count ?? 0
  const todayAttendance = attendanceRes.count ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payments = (paymentsRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentPlans = (paymentPlansRes.data ?? []) as any[]

  const paymentPlanIds = paymentPlans
    .map((plan) => plan.id as string | null | undefined)
    .filter((value): value is string => Boolean(value))

  const installmentsRes = paymentPlanIds.length === 0
    ? { data: [], error: null }
    : await supabase
        .from('installments')
        .select('payment_plan_id, amount_due, amount_paid, status, due_date')
        .in('payment_plan_id', paymentPlanIds)

  if (installmentsRes.error) throw new Error(installmentsRes.error.message)

  const studentsForPaymentsRes = studentCount === 0
    ? { data: [], error: null }
    : await supabase
        .from('students')
        .select('id, nombres, apellidos')
        .eq('school_id', schoolId)
        .is('deleted_at', null)

  if (studentsForPaymentsRes.error) throw new Error(studentsForPaymentsRes.error.message)

  const totalIncome = payments.reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0)
  const monthlyIncome = payments.reduce((sum: number, payment: any) => {
    const paidAt = payment.paid_at as string | null
    if (!paidAt || paidAt < thirtyDaysAgo) return sum
    return sum + (Number(payment.amount) || 0)
  }, 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const installments = (installmentsRes.data ?? []) as any[]
  const pendingInstallments = installments.filter((installment) => installment.status !== 'pagado')
  const totalDebt = pendingInstallments.reduce((sum: number, installment: any) => {
    const amountDue = Number(installment.amount_due) || 0
    const amountPaid = Number(installment.amount_paid) || 0
    return sum + Math.max(amountDue - amountPaid, 0)
  }, 0)
  const attendanceRate = studentCount > 0 ? Math.min((todayAttendance / studentCount) * 100, 100) : 0

  const paymentPlanToStudentMap = new Map<string, string>()
  for (const plan of paymentPlans) {
    const paymentPlanId = plan.id as string | null | undefined
    const studentId = plan.student_id as string | null | undefined
    if (paymentPlanId && studentId) paymentPlanToStudentMap.set(paymentPlanId, studentId)
  }

  const studentNameMap = new Map<string, string>()
  for (const student of (studentsForPaymentsRes.data ?? []) as any[]) {
    const studentId = student.id as string | null | undefined
    if (!studentId) continue
    const fullName = `${(student.apellidos as string | null) ?? ''}, ${(student.nombres as string | null) ?? ''}`.trim().replace(/^,\s*/, '') || '—'
    studentNameMap.set(studentId, fullName)
  }

  const recentPayments = payments.slice(0, 10).map((payment: any) => {
    const paymentPlanId = payment.payment_plan_id as string | null
    const studentId = paymentPlanId ? paymentPlanToStudentMap.get(paymentPlanId) ?? null : null
    return {
      id: payment.id as string,
      amount: Number(payment.amount) || 0,
      method: (payment.method as string | null) ?? '—',
      paidAt: (payment.paid_at as string | null) ?? '',
      studentName: studentId ? studentNameMap.get(studentId) ?? '—' : '—',
      status: 'completado',
    }
  })

  const dateLabel = now.toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const quickActions = [
    {
      href: '/scan',
      label: 'Escanear QR',
      description: 'Registrar asistencia o validar estado de deuda.',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.24M16.243 7.757l1.414-1.414M7.757 16.243l-1.414 1.414M4 12H2m5.757-4.243L6.343 6.343" />
        </svg>
      ),
      chipClassName: 'bg-blue-50 text-blue-700',
    },
    {
      href: '/students/nuevo',
      label: 'Nueva matrícula',
      description: 'Crear el registro del alumno y su plan de pago.',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      chipClassName: 'bg-green-50 text-green-700',
    },
    {
      href: '/morosos',
      label: 'Ver morosos',
      description: 'Revisar deuda vencida y priorizar seguimiento.',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      chipClassName: 'bg-red-50 text-red-700',
    },
  ]

  const kpis = [
    {
      label: 'Alumnos matriculados',
      value: studentCount.toString(),
      sub: `Activos: ${studentCount}`,
      accent: 'from-blue-600/15 to-blue-600/5',
      valueClassName: 'text-blue-700',
      iconWrapClassName: 'bg-blue-50 text-blue-700',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Ingresos',
      value: formatSoles(totalIncome),
      sub: `Mes: ${formatSoles(monthlyIncome)}`,
      accent: 'from-green-600/15 to-green-600/5',
      valueClassName: 'text-green-700',
      iconWrapClassName: 'bg-green-50 text-green-700',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Deuda pendiente',
      value: formatSoles(totalDebt),
      sub: `${pendingInstallments.length} cuotas pendientes`,
      accent: 'from-red-600/15 to-red-600/5',
      valueClassName: 'text-red-700',
      iconWrapClassName: 'bg-red-50 text-red-700',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: 'Asistencia hoy',
      value: todayAttendance.toString(),
      sub: `Tasa: ${attendanceRate.toFixed(0)}%`,
      accent: 'from-yellow-500/20 to-yellow-500/5',
      valueClassName: 'text-yellow-700',
      iconWrapClassName: 'bg-yellow-50 text-yellow-700',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ]

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-7 md:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                Resumen operativo
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Panel de Control</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
                Supervisa matrícula, cobranza y asistencia desde una vista rápida para operación diaria.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">Fecha</p>
              <p className="mt-1 text-sm font-semibold capitalize text-gray-700">{dateLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm transition-all duration-150 hover:border-gray-300 hover:shadow-md active:scale-[0.98]"
          >
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${action.chipClassName}`}>
              {action.icon}
            </div>
            <p className="text-sm font-semibold text-gray-900">{action.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br ${kpi.accent} p-4 shadow-sm md:p-5`}
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">{kpi.label}</p>
                <p className={`mt-3 text-2xl font-bold tracking-tight md:text-[1.9rem] ${kpi.valueClassName}`}>{kpi.value}</p>
              </div>

              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${kpi.iconWrapClassName}`}>
                {kpi.icon}
              </div>
            </div>

            <p className="text-xs font-medium text-gray-500 md:text-sm">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 md:text-base">Últimas transacciones</h2>
            <p className="mt-1 text-sm text-gray-500">Pagos registrados recientemente en ventanilla.</p>
          </div>
          <Link
            href="/students"
            className="inline-flex min-h-11 items-center text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            Ver todos
          </Link>
        </div>

        {recentPayments.length === 0 ? (
          <div className="px-4 py-12 text-center md:px-5">
            <p className="text-sm text-gray-400">Sin pagos registrados aún.</p>
          </div>
        ) : (
          <div>
            <div className="space-y-3 p-4 md:hidden">
              {recentPayments.map((p) => {
                return (
                  <article key={p.id} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{p.studentName}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatDate(p.paidAt)}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">Monto</p>
                        <p className="mt-1 text-sm font-semibold text-gray-700">{formatSoles(p.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">Método</p>
                        <p className="mt-1 text-sm font-semibold capitalize text-gray-700">{p.method}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Alumno</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Monto</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Método</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Fecha</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPayments.map((p) => {
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-gray-50/70">
                        <td className="max-w-[220px] px-5 py-4 font-semibold text-gray-800">{p.studentName}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-700">{formatSoles(p.amount)}</td>
                        <td className="px-5 py-4 text-sm capitalize text-gray-600">{p.method}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{formatDate(p.paidAt)}</td>
                        <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData />
      </Suspense>
    </div>
  )
}
