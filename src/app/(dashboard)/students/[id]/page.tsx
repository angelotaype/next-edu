import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentTabs, { type StudentDetail } from './StudentTabs'
import type { AttendanceRow } from './AttendanceTab'
import type { InstallmentRow } from './PaymentsTab'

export const dynamic = 'force-dynamic'

function fullName(student: { nombres?: string | null; apellidos?: string | null }) {
  return `${student.apellidos ?? ''}, ${student.nombres ?? ''}`.trim().replace(/^,\s*/, '') || 'Alumno sin nombre'
}

async function getStudentData(studentId: string): Promise<{
  student: StudentDetail
  installments: InstallmentRow[]
  attendances: AttendanceRow[]
}> {
  const supabase = createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [studentRes, installmentsRes, attendanceRes] = await Promise.all([
    db
      .from('students')
      .select(`
        id, code, nombres, apellidos, estado_matricula,
        classrooms ( id, name, cycles ( id, name ) )
      `)
      .eq('id', studentId)
      .single(),
    db
      .from('installments')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: true }),
    db
      .from('attendance_logs')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false }),
  ])

  if (studentRes.error) {
    if (studentRes.error.code === 'PGRST116') notFound()
    throw new Error(studentRes.error.message)
  }

  if (installmentsRes.error) throw new Error(installmentsRes.error.message)
  if (attendanceRes.error) throw new Error(attendanceRes.error.message)

  const studentRaw = studentRes.data as any
  const classroom = studentRaw.classrooms as { name?: string | null; cycles?: { name?: string | null } | null } | null

  const student: StudentDetail = {
    id: studentRaw.id as string,
    fullName: fullName(studentRaw),
    code: (studentRaw.code as string | null) ?? null,
    cycleName: classroom?.cycles?.name ?? null,
    classroomName: classroom?.name ?? null,
    status: (studentRaw.estado_matricula as string | null) ?? null,
  }

  const installments: InstallmentRow[] = ((installmentsRes.data ?? []) as any[]).map((row) => ({
    id: row.id as string,
    amount: typeof row.amount === 'number' ? row.amount : row.amount != null ? Number(row.amount) : null,
    dueDate: (row.due_date as string | null) ?? null,
    status: (row.status as string | null) ?? null,
  }))

  const attendances: AttendanceRow[] = ((attendanceRes.data ?? []) as any[]).map((row) => ({
    id: row.id as string,
    dateLabel: (row.check_in ?? row.checked_in_at ?? row.created_at ?? null) as string | null,
    checkIn: (row.check_in ?? row.checked_in_at ?? null) as string | null,
    checkOut: (row.check_out ?? row.checked_out_at ?? null) as string | null,
  }))

  return { student, installments, attendances }
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const { student, installments, attendances } = await getStudentData(params.id)

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-7 md:py-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Alumno</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">{student.fullName}</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
            Revisa información general, cuotas, asistencia y carnet QR desde un solo panel.
          </p>
        </div>
      </div>

      <StudentTabs student={student} installments={installments} attendances={attendances} />
    </div>
  )
}
