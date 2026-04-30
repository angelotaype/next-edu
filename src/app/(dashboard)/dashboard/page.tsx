import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

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
  completed: { label: 'Pagado', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
  partial: { label: 'Parcial', className: 'bg-blue-100 text-blue-700' },
  overdue: { label: 'Vencido', className: 'bg-red-100 text-red-700' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-8 w-28 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-t border-gray-100">
            <div className="h-4 flex-1 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
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

  const [studentsRes, incomeRes, debtRes, attendanceRes, paymentsRes] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('payments').select('amount')
      .eq('school_id', schoolId).eq('status', 'completed').gte('created_at', thirtyDaysAgo),
    supabase.from('student_debt_summary').select('debt_amount').eq('school_id', schoolId),
    supabase.from('attendance_logs').select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId).gte('scanned_at', todayStart).lt('scanned_at', tomorrowStart),
    supabase.from('payments')
      .select('id, amount, created_at, status, students(nombres, apellidos)')
      .eq('school_id', schoolId).order('created_at', { ascending: false }).limit(5),
  ])

  const studentCount = studentsRes.count ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monthlyIncome = (incomeRes.data ?? []).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalDebt = (debtRes.data ?? []).reduce((s: number, d: any) => s + (Number(d.debt_amount) || 0), 0)
  const todayAttendance = attendanceRes.count ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentPayments = (paymentsRes.data ?? []) as any[]

  const dateLabel = now.toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const kpis = [
    {
      label: 'Alumnos matriculados',
      value: studentCount.toString(),
      sub: 'ciclo activo',
      colorBorder: 'border-l-blue-500',
      colorValue: 'text-blue-700',
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Ingresos (30 días)',
      value: formatSoles(monthlyIncome),
      sub: 'pagos completados',
      colorBorder: 'border-l-green-500',
      colorValue: 'text-green-700',
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Deuda total',
      value: formatSoles(totalDebt),
      sub: 'pendiente de cobro',
      colorBorder: 'border-l-red-500',
      colorValue: 'text-red-700',
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: 'Asistencia hoy',
      value: todayAttendance.toString(),
      sub: 'scans QR hoy',
      colorBorder: 'border-l-yellow-500',
      colorValue: 'text-yellow-700',
      icon: (
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-sm text-gray-500 capitalize">{dateLabel}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link href="/scan"
          className="flex flex-col items-center gap-2 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl px-4 py-4 transition-colors shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.24M16.243 7.757l1.414-1.414M7.757 16.243l-1.414 1.414M4 12H2m5.757-4.243L6.343 6.343" />
          </svg>
          <span className="text-sm font-semibold text-center leading-tight">QR Scanner</span>
        </Link>
        <Link href="/students/nuevo"
          className="flex flex-col items-center gap-2 bg-[#16A34A] hover:bg-green-700 active:bg-green-800 text-white rounded-xl px-4 py-4 transition-colors shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="text-sm font-semibold text-center leading-tight">Nueva matrícula</span>
        </Link>
        <Link href="/morosos"
          className="flex flex-col items-center gap-2 bg-[#DC2626] hover:bg-red-700 active:bg-red-800 text-white rounded-xl px-4 py-4 transition-colors shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-semibold text-center leading-tight">Ver morosos</span>
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.label}
            className={`bg-white rounded-xl border border-gray-200 border-l-4 ${kpi.colorBorder} p-5 shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">{kpi.label}</p>
              {kpi.icon}
            </div>
            <p className={`text-2xl font-bold ${kpi.colorValue} leading-none mb-1`}>{kpi.value}</p>
            <p className="text-xs text-gray-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-sm">Últimas transacciones</h2>
          <Link href="/students" className="text-xs text-blue-600 hover:underline">Ver todos →</Link>
        </div>

        {recentPayments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Sin pagos registrados aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Alumno</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Monto</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Fecha</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPayments.map((p) => {
                  const student = p.students as { nombres?: string; apellidos?: string } | null
                  const name = student
                    ? `${student.apellidos ?? ''}, ${student.nombres ?? ''}`.trim().replace(/^,\s*/, '')
                    : '—'
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800 max-w-[160px] truncate">{name}</td>
                      <td className="px-5 py-3 text-gray-700 font-mono text-xs">{formatSoles(Number(p.amount))}</td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell text-xs">{formatDate(p.created_at)}</td>
                      <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardData />
          </Suspense>
        </main>
      </div>
    </div>
  )
}