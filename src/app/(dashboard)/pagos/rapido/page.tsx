import { redirect } from 'next/navigation'
import { differenceInCalendarDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import DeudoresTable, { type DeudorRow } from './DeudoresTable'

export const dynamic = 'force-dynamic'

function fullName(student: { nombres?: string | null; apellidos?: string | null }) {
  return `${student.apellidos ?? ''}, ${student.nombres ?? ''}`.trim().replace(/^,\s*/, '') || 'Alumno sin nombre'
}

async function getDeudores(): Promise<DeudorRow[]> {
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
        students ( id, code, documento, nombres, apellidos, photo_url ),
        cycles ( id, name ),
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

  const today = new Date()
  const grouped = new Map<string, DeudorRow>()

  for (const installment of installments) {
    const enrollmentId = installment.enrollment_id as string | null
    if (!enrollmentId) continue

    const enrollment = enrollmentMap.get(enrollmentId)
    if (!enrollment) continue

    const student = enrollment.students as {
      id?: string | null
      code?: string | null
      documento?: string | null
      nombres?: string | null
      apellidos?: string | null
      photo_url?: string | null
    } | null

    const studentId = (student?.id as string | null | undefined) ?? (enrollment.student_id as string | null | undefined)
    if (!studentId) continue

    const amount = typeof installment.amount_due === 'number' ? installment.amount_due : Number(installment.amount_due) || 0
    const dueDate = installment.due_date ? new Date(installment.due_date as string) : null
    const isOverdue = dueDate ? differenceInCalendarDays(today, dueDate) > 0 : false
    const cycle = enrollment.cycles as { name?: string | null } | null
    const classroom = enrollment.classrooms as { name?: string | null } | null

    const existing = grouped.get(studentId)
    if (!existing) {
      grouped.set(studentId, {
        id: studentId,
        code: (student?.code as string | null) ?? null,
        documento: (student?.documento as string | null) ?? null,
        fullName: fullName(student ?? {}),
        photoUrl: (student?.photo_url as string | null) ?? null,
        cycleName: cycle?.name ?? null,
        classroomName: classroom?.name ?? null,
        debtTotal: amount,
        overdueDebt: isOverdue ? amount : 0,
      })
      continue
    }

    existing.debtTotal += amount
    if (isOverdue) existing.overdueDebt += amount
  }

  return Array.from(grouped.values())
    .filter((row) => row.debtTotal > 0)
    .sort((a, b) => b.overdueDebt - a.overdueDebt || b.debtTotal - a.debtTotal)
}

export default async function PagoRapidoPage() {
  const rows = await getDeudores()

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.10),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-7 md:py-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Pagos</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Pago rápido</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
            Busca alumnos con deuda, abre el modal de cobro y registra abonos sin pasar por QR.
          </p>
        </div>
      </div>

      <DeudoresTable rows={rows} />
    </div>
  )
}
