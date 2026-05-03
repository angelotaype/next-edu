import { redirect } from 'next/navigation'
import { differenceInCalendarDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import MorososTable, { type MorosoRow } from './MorososTable'

export const dynamic = 'force-dynamic'

function studentFullName(student: { nombres?: string | null; apellidos?: string | null }) {
  return `${student.apellidos ?? ''}, ${student.nombres ?? ''}`.trim().replace(/^,\s*/, '') || 'Alumno sin nombre'
}

async function getMorososRows(): Promise<MorosoRow[]> {
  const supabase = createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [enrollmentsRes, installmentsRes] = await Promise.all([
    db
      .from('enrollments')
      .select(`
        id,
        student_id,
        cycle_id,
        classroom_id,
        students ( id, nombres, apellidos ),
        cycles ( id, name, start_date ),
        classrooms ( id, name )
      `),
    db
      .from('installments')
      .select('id, enrollment_id, amount_due, due_date, status')
      .neq('status', 'pagado')
      .order('due_date', { ascending: true }),
  ])

  if (enrollmentsRes.error) throw new Error(enrollmentsRes.error.message)
  if (installmentsRes.error) throw new Error(installmentsRes.error.message)

  const enrollments = (enrollmentsRes.data ?? []) as any[]
  const installments = (installmentsRes.data ?? []) as any[]

  const enrollmentMap = new Map<string, any>()
  for (const enrollment of enrollments) {
    if (enrollment?.id) enrollmentMap.set(enrollment.id as string, enrollment)
  }

  const enrollmentIds = Array.from(
    new Set(
      installments
        .map((installment) => installment.enrollment_id as string | null | undefined)
        .filter((value): value is string => Boolean(value))
    )
  )

  const studentIds = Array.from(
    new Set(
      enrollmentIds
        .map((id) => {
          const enrollment = enrollmentMap.get(id)
          return (enrollment?.student_id as string | null | undefined) ?? (enrollment?.students?.id as string | null | undefined)
        })
        .filter((value): value is string => Boolean(value))
    )
  )

  const paymentsRes = studentIds.length === 0
    ? { data: [], error: null }
    : await db
        .from('payments')
        .select('student_id, created_at, status')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })

  if (paymentsRes.error) throw new Error(paymentsRes.error.message)

  const lastPaymentMap = new Map<string, string>()
  for (const payment of (paymentsRes.data ?? []) as any[]) {
    const studentId = payment.student_id as string | null
    const createdAt = payment.created_at as string | null
    if (!studentId || !createdAt || lastPaymentMap.has(studentId)) continue
    lastPaymentMap.set(studentId, createdAt)
  }

  const grouped = new Map<string, MorosoRow>()
  const today = new Date()

  for (const installment of installments) {
    const enrollmentId = installment.enrollment_id as string | null
    if (!enrollmentId) continue

    const enrollment = enrollmentMap.get(enrollmentId)
    if (!enrollment) continue

    const student = enrollment.students as { id?: string | null; nombres?: string | null; apellidos?: string | null } | null
    const cycle = enrollment.cycles as { name?: string | null; start_date?: string | null } | null
    const classroom = enrollment.classrooms as { name?: string | null } | null
    const studentId = (student?.id as string | null | undefined) ?? (enrollment.student_id as string | null | undefined)

    if (!studentId) continue

    const amount = typeof installment.amount_due === 'number' ? installment.amount_due : Number(installment.amount_due) || 0
    const dueDate = (installment.due_date as string | null) ?? null

    const existing = grouped.get(studentId)
    if (!existing) {
      const daysLate = dueDate ? differenceInCalendarDays(today, new Date(dueDate)) : 0
      grouped.set(studentId, {
        studentId,
        fullName: studentFullName(student ?? {}),
        cycleName: (cycle?.name as string | null) ?? null,
        classroomName: (classroom?.name as string | null) ?? null,
        debtTotal: amount,
        lastPaymentAt: lastPaymentMap.get(studentId) ?? null,
        dueDate,
        daysLate: daysLate > 0 ? daysLate : 0,
        state: daysLate > 0 ? 'VENCIDO' : 'POR_VENCER',
      })
      continue
    }

    existing.debtTotal += amount

    if (dueDate && (!existing.dueDate || new Date(dueDate) < new Date(existing.dueDate))) {
      const daysLate = differenceInCalendarDays(today, new Date(dueDate))
      existing.dueDate = dueDate
      existing.daysLate = daysLate > 0 ? daysLate : 0
      existing.state = daysLate > 0 ? 'VENCIDO' : 'POR_VENCER'
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}

export default async function MorososPage() {
  const rows = await getMorososRows()

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.10),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-7 md:py-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Cobranza</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Estudiantes morosos</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
            Prioriza seguimiento, identifica vencimientos y entra directo al detalle de pagos del alumno.
          </p>
        </div>
      </div>

      <MorososTable rows={rows} />
    </div>
  )
}
