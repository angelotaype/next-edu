import { redirect } from 'next/navigation'
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

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const schoolId = (profile as { school_id?: string } | null)?.school_id

  if (profileError || !schoolId) {
    throw new Error('No se pudo resolver el colegio actual.')
  }

  const { data: debtRows, error: debtError } = await db
    .from('student_qr_status')
    .select('*')
    .eq('school_id', schoolId)
    .gt('total_debt', 0)
    .order('overdue_debt', { ascending: false })
    .order('apellidos', { ascending: true })

  if (debtError) throw new Error(debtError.message)

  const students = (debtRows ?? []) as any[]
  const studentIds = students
    .map((student) => student.id as string | null | undefined)
    .filter((value): value is string => Boolean(value))
  const paymentPlanIds = students
    .map((student) => student.payment_plan_id as string | null | undefined)
    .filter((value): value is string => Boolean(value))

  const [studentsMetaRes, paymentsRes] = await Promise.all([
    studentIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : db
          .from('students')
          .select(`
            id,
            cycles!cycle_id ( id, name ),
            classrooms!classroom_id ( id, name )
          `)
          .in('id', studentIds),
    paymentPlanIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : db
          .from('payments')
          .select('payment_plan_id, paid_at')
          .in('payment_plan_id', paymentPlanIds)
          .order('paid_at', { ascending: false }),
  ])

  if (studentsMetaRes.error) throw new Error(studentsMetaRes.error.message)
  if (paymentsRes.error) throw new Error(paymentsRes.error.message)

  const studentMetaMap = new Map<string, any>()
  for (const student of (studentsMetaRes.data ?? []) as any[]) {
    const studentId = student.id as string | null | undefined
    if (studentId) studentMetaMap.set(studentId, student)
  }

  const lastPaymentMap = new Map<string, string>()
  for (const payment of (paymentsRes.data ?? []) as any[]) {
    const paymentPlanId = payment.payment_plan_id as string | null | undefined
    const paidAt = payment.paid_at as string | null | undefined
    if (paymentPlanId && paidAt && !lastPaymentMap.has(paymentPlanId)) {
      lastPaymentMap.set(paymentPlanId, paidAt)
    }
  }

  return students.map((student) => {
    const studentId = student.id as string
    const meta = studentMetaMap.get(studentId) ?? null
    const cycle = meta?.cycles as { name?: string | null } | null
    const classroom = meta?.classrooms as { name?: string | null } | null
    const overdueDebt = Number(student.overdue_debt) || 0
    const nextDueDate = (student.next_due_date as string | null) ?? null

      return {
        studentId,
        fullName: studentFullName(student),
        cycleName: cycle?.name ?? null,
        classroomName: classroom?.name ?? null,
      debtTotal: Number(student.total_debt) || 0,
      lastPaymentAt: lastPaymentMap.get((student.payment_plan_id as string | null) ?? '') ?? null,
      dueDate: nextDueDate,
        daysLate: overdueDebt > 0 && nextDueDate
          ? Math.max(0, Math.floor((Date.now() - new Date(nextDueDate).getTime()) / (1000 * 60 * 60 * 24)))
          : 0,
        state: (overdueDebt > 0 ? 'VENCIDO' : 'POR_VENCER') as MorosoRow['state'],
        paymentStatus: (student.payment_status as string | null) ?? 'Debe pagar',
        overdueDebt,
      }
  }).sort((a, b) => b.overdueDebt - a.overdueDebt || b.debtTotal - a.debtTotal || a.fullName.localeCompare(b.fullName))
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
