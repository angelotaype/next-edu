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
  try {
    const supabase = createClient()
    const db = supabase as any

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    let studentRes: any
    try {
      studentRes = await db
        .from('students')
        .select(`
          id, code, nombres, apellidos, estado, dni,
          cycle_id, classroom_id, estado_matricula,
          cycles!cycle_id(id, name),
          classrooms!classroom_id(id, name)
        `)
        .eq('id', studentId)
        .single()

      if (studentRes.error) {
        console.error('❌ STUDENT ERROR COMPLETO:', JSON.stringify(studentRes.error, null, 2))
        if (studentRes.error.code === 'PGRST116') notFound()
        throw new Error(`Student: ${studentRes.error.code} - ${studentRes.error.message}`)
      }
    } catch (e) {
      console.error('❌ Complete error:', e)
      throw e
    }

    const enrollmentsRes = await db
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)

    if (enrollmentsRes.error) {
      console.error('❌ Enrollments query error:', enrollmentsRes.error)
      throw new Error(`Enrollments: ${enrollmentsRes.error.message}`)
    }

    const enrollmentIds = ((enrollmentsRes.data ?? []) as Array<{ id?: string | null }>)
      .map((row) => row.id)
      .filter((value): value is string => Boolean(value))

    const [installmentsRes, attendanceRes] = enrollmentIds.length === 0
      ? [
          { data: [], error: null },
          await db
            .from('attendance_logs')
            .select('*')
            .eq('student_id', studentId)
            .order('scanned_at', { ascending: false }),
        ]
      : await Promise.all([
          db
            .from('installments')
            .select('*')
            .in('enrollment_id', enrollmentIds)
            .order('due_date', { ascending: true }),
          db
            .from('attendance_logs')
            .select('*')
            .eq('student_id', studentId)
            .order('scanned_at', { ascending: false }),
        ])

    if (installmentsRes.error) {
      console.error('❌ Installments query error:', installmentsRes.error)
      throw new Error(`Installments: ${installmentsRes.error.message}`)
    }

    if (attendanceRes.error) {
      console.error('❌ Attendance query error:', attendanceRes.error)
      throw new Error(`Attendance: ${attendanceRes.error.message}`)
    }

    const studentRaw = studentRes.data as any
    const cycles = studentRaw.cycles as { id?: string; name?: string } | null
    const classrooms = studentRaw.classrooms as { id?: string; name?: string } | null

    const student: StudentDetail = {
      id: studentRaw.id as string,
      fullName: fullName(studentRaw),
      code: (studentRaw.code as string | null) ?? null,
      cycleName: cycles?.name ?? null,
      classroomName: classrooms?.name ?? null,
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
      dateLabel: (row.scanned_at ?? null) as string | null,
      checkIn: (row.scanned_at ?? null) as string | null,
      checkOut: null,
    }))

    return { student, installments, attendances }
  } catch (e) {
    console.error('❌ Complete error:', e)
    throw e
  }
}

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { tab?: string }
}) {
  const { student, installments, attendances } = await getStudentData(params.id)
  const tab = searchParams?.tab
  const initialTab = tab === 'payments' || tab === 'attendance' || tab === 'card' ? tab : 'info'

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

      <StudentTabs student={student} installments={installments} attendances={attendances} initialTab={initialTab} />
    </div>
  )
}
