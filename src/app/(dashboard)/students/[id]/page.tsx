import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentTabs, { type StudentDetail } from './StudentTabs'
import type { AttendanceRow } from './AttendanceTab'
import type { InstallmentRow, PaymentPlanRow } from './PaymentsTab'

export const dynamic = 'force-dynamic'

function fullName(student: { nombres?: string | null; apellidos?: string | null }) {
  return `${student.apellidos ?? ''}, ${student.nombres ?? ''}`.trim().replace(/^,\s*/, '') || 'Alumno sin nombre'
}

async function getStudentData(studentId: string): Promise<{
  student: StudentDetail
  plans: PaymentPlanRow[]
  installments: InstallmentRow[]
  attendances: AttendanceRow[]
  planTotal: number
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
          *, 
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

    const paymentPlansRes = await db
      .from('payment_plans')
      .select('id, name, total_amount, status')
      .eq('student_id', studentId)
      .is('deleted_at', null)

    if (paymentPlansRes.error) {
      console.error('❌ Payment plans query error:', paymentPlansRes.error)
      throw new Error(`PaymentPlans: ${paymentPlansRes.error.message}`)
    }

    const paymentPlans = (paymentPlansRes.data ?? []) as Array<{
      id?: string | null
      name?: string | null
      total_amount?: number | string | null
      status?: string | null
    }>

    const paymentPlanIds = paymentPlans
      .map((row) => row.id)
      .filter((value): value is string => Boolean(value))

    const planTotal = paymentPlans.reduce((sum, row) => sum + (Number(row.total_amount) || 0), 0)
    const plans: PaymentPlanRow[] = paymentPlans
      .filter((row) => Boolean(row.id))
      .map((row) => ({
        id: row.id as string,
        name: row.name ?? null,
        totalAmount: row.total_amount != null ? Number(row.total_amount) : null,
        status: row.status ?? null,
      }))

    const [installmentsRes, attendanceRes] = paymentPlanIds.length === 0
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
            .in('payment_plan_id', paymentPlanIds)
            .order('installment_number', { ascending: true }),
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
      dni: (studentRaw.dni as string | null) ?? null,
      fechaNacimiento: (studentRaw.fecha_nacimiento as string | null) ?? null,
      telefono: (studentRaw.telefono as string | null) ?? null,
      email: (studentRaw.email as string | null) ?? null,
      direccion: (studentRaw.direccion as string | null) ?? null,
      qrToken: (studentRaw.qr_token as string | null) ?? null,
      apoderadoNombre: (studentRaw.apoderado_nombre as string | null) ?? null,
      apoderadoTelefono: (studentRaw.apoderado_telefono as string | null) ?? null,
      apoderadoEmail: (studentRaw.apoderado_email as string | null) ?? null,
      observaciones: (studentRaw.observaciones as string | null) ?? null,
    }

    const installments: InstallmentRow[] = ((installmentsRes.data ?? []) as any[]).map((row) => ({
      id: row.id as string,
      paymentPlanId: (row.payment_plan_id as string | null) ?? null,
      installmentNumber:
        typeof row.installment_number === 'number'
          ? row.installment_number
          : row.installment_number != null
            ? Number(row.installment_number)
            : null,
      amountDue: typeof row.amount_due === 'number' ? row.amount_due : row.amount_due != null ? Number(row.amount_due) : null,
      amountPaid: typeof row.amount_paid === 'number' ? row.amount_paid : row.amount_paid != null ? Number(row.amount_paid) : null,
      dueDate: (row.due_date as string | null) ?? null,
      status: (row.status as string | null) ?? null,
    }))

    const attendances: AttendanceRow[] = ((attendanceRes.data ?? []) as any[]).map((row) => ({
      id: row.id as string,
      dateLabel: (row.scanned_at ?? null) as string | null,
      checkIn: (row.scanned_at ?? null) as string | null,
      checkOut: null,
    }))

    return { student, plans, installments, attendances, planTotal }
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
  const { student, plans, installments, attendances, planTotal } = await getStudentData(params.id)
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

      <StudentTabs student={student} plans={plans} installments={installments} attendances={attendances} planTotal={planTotal} initialTab={initialTab} />
    </div>
  )
}
