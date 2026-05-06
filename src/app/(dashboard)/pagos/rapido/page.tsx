import { redirect } from 'next/navigation'
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
    .order('apellidos', { ascending: true })

  if (debtError) throw new Error(debtError.message)

  const students = (debtRows ?? []) as any[]
  const studentIds = students
    .map((student) => student.id as string | null | undefined)
    .filter((value): value is string => Boolean(value))

  const studentsMetaRes = studentIds.length === 0
    ? { data: [], error: null }
    : await db
        .from('students')
        .select(`
          id,
          dni,
          cycles!cycle_id ( id, name ),
          classrooms!classroom_id ( id, name )
        `)
        .in('id', studentIds)

  if (studentsMetaRes.error) throw new Error(studentsMetaRes.error.message)

  const studentMetaMap = new Map<string, any>()
  for (const student of (studentsMetaRes.data ?? []) as any[]) {
    const studentId = student.id as string | null | undefined
    if (studentId) studentMetaMap.set(studentId, student)
  }

  return students
    .map((student) => {
      const studentId = student.id as string
      const meta = studentMetaMap.get(studentId) ?? null
      const cycle = meta?.cycles as { name?: string | null } | null
      const classroom = meta?.classrooms as { name?: string | null } | null

      return {
        id: studentId,
        code: (student.code as string | null) ?? null,
        dni: (meta?.dni as string | null | undefined) ?? null,
        fullName: fullName(student),
        photoUrl: (student.photo_url as string | null) ?? null,
        cycleName: cycle?.name ?? null,
        classroomName: classroom?.name ?? null,
        debtTotal: Number(student.total_debt) || 0,
        overdueDebt: Number(student.overdue_debt) || 0,
        paymentStatus: (student.payment_status as string | null) ?? 'Al día',
        pendingInstallments: Number(student.pending_installments) || 0,
        nextInstallmentAmount: Number(student.next_installment_amount) || 0,
      }
    })
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
