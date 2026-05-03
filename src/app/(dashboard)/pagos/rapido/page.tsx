import { redirect } from 'next/navigation'
import { differenceInCalendarDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import AlumnosTable, { type AlumnoRow } from './AlumnosTable'

export const dynamic = 'force-dynamic'

function fullName(student: { nombres?: string | null; apellidos?: string | null }) {
  return `${student.apellidos ?? ''}, ${student.nombres ?? ''}`.trim().replace(/^,\s*/, '') || 'Alumno sin nombre'
}

async function getAlumnos(): Promise<AlumnoRow[]> {
  const supabase = createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [studentsRes, enrollmentsRes, installmentsRes] = await Promise.all([
    db
      .from('students')
      .select('id, code, dni, nombres, apellidos, photo_url')
      .is('deleted_at', null)
      .order('apellidos', { ascending: true }),
    db
      .from('enrollments')
      .select(`
        id,
        student_id,
        cycles ( id, name ),
        classrooms ( id, name )
      `)
      .order('created_at', { ascending: false }),
    db
      .from('installments')
      .select('id, enrollment_id, amount_due, due_date, status')
      .order('due_date', { ascending: true }),
  ])

  if (studentsRes.error) throw new Error(studentsRes.error.message)
  if (enrollmentsRes.error) throw new Error(enrollmentsRes.error.message)
  if (installmentsRes.error) throw new Error(installmentsRes.error.message)

  const students = (studentsRes.data ?? []) as any[]
  const enrollments = (enrollmentsRes.data ?? []) as any[]
  const installments = (installmentsRes.data ?? []) as any[]

  const latestEnrollmentByStudent = new Map<string, any>()
  for (const enrollment of enrollments) {
    const studentId = enrollment?.student_id as string | null | undefined
    if (studentId && !latestEnrollmentByStudent.has(studentId)) {
      latestEnrollmentByStudent.set(studentId, enrollment)
    }
  }

  const today = new Date()
  const grouped = new Map<string, AlumnoRow>()

  for (const student of students) {
    const studentId = student.id as string
    const enrollment = latestEnrollmentByStudent.get(studentId) ?? null
    const cycle = enrollment?.cycles as { name?: string | null } | null
    const classroom = enrollment?.classrooms as { name?: string | null } | null

    grouped.set(studentId, {
      id: studentId,
      code: (student.code as string | null) ?? null,
      dni: (student.dni as string | null) ?? null,
      fullName: fullName(student),
      photoUrl: (student.photo_url as string | null) ?? null,
      cycleName: cycle?.name ?? null,
      classroomName: classroom?.name ?? null,
      debtTotal: 0,
      overdueDebt: 0,
    })
  }

  const enrollmentStudentMap = new Map<string, string>()
  for (const enrollment of enrollments) {
    const enrollmentId = enrollment?.id as string | null | undefined
    const studentId = enrollment?.student_id as string | null | undefined
    if (enrollmentId && studentId) enrollmentStudentMap.set(enrollmentId, studentId)
  }

  for (const installment of installments) {
    const enrollmentId = installment.enrollment_id as string | null
    if (!enrollmentId) continue

    const studentId = enrollmentStudentMap.get(enrollmentId)
    if (!studentId) continue

    const row = grouped.get(studentId)
    if (!row) continue

    const amount = typeof installment.amount_due === 'number' ? installment.amount_due : Number(installment.amount_due) || 0
    const dueDate = installment.due_date ? new Date(installment.due_date as string) : null
    const isOverdue = dueDate ? differenceInCalendarDays(today, dueDate) > 0 : false

    row.debtTotal += amount
    if (isOverdue) row.overdueDebt += amount
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.overdueDebt - a.overdueDebt || b.debtTotal - a.debtTotal || a.fullName.localeCompare(b.fullName))
}

export default async function PagoRapidoPage() {
  const rows = await getAlumnos()

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.10),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-7 md:py-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Pagos</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Pago rápido</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
            Busca cualquier alumno, revisa su estado de deuda y registra abonos sin pasar por QR.
          </p>
        </div>
      </div>

      <AlumnosTable rows={rows} />
    </div>
  )
}
