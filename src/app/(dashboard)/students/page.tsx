import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StudentsTable, { type StudentRow } from './StudentsTable'

export const dynamic = 'force-dynamic'

function StudentsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-full bg-gray-200 rounded-lg" />
      <div className="h-10 w-full bg-gray-100 rounded-lg" />
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-t border-gray-100 first:border-t-0">
            <div className="h-4 flex-1 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

async function StudentsData() {
  const supabase = createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRaw as any
  if (!profile?.school_id) redirect('/login')

  const schoolId = profile.school_id as string

  const { data: debtRows, error: debtError } = await db
    .from('student_qr_status')
    .select('*')
    .eq('school_id', schoolId)
    .order('apellidos', { ascending: true })

  if (debtError) throw new Error(debtError.message)

  const qrStudents = (debtRows ?? []) as any[]
  const studentIds = qrStudents
    .map((student) => student.id as string | null | undefined)
    .filter((value): value is string => Boolean(value))

  const studentsMetaRes = studentIds.length === 0
    ? { data: [], error: null }
    : await db
        .from('students')
        .select(`
          id,
          estado_matricula,
          classroom_id,
          classrooms ( id, name, cycle_id, cycles ( id, name ) )
        `)
        .in('id', studentIds)

  if (studentsMetaRes.error) throw new Error(studentsMetaRes.error.message)

  const studentsMetaMap = new Map<string, any>()
  for (const student of (studentsMetaRes.data ?? []) as any[]) {
    const studentId = student.id as string | null | undefined
    if (studentId) studentsMetaMap.set(studentId, student)
  }

  const rows: StudentRow[] = qrStudents.map((student) => {
    const meta = studentsMetaMap.get(student.id as string) ?? null
    const classroom = meta?.classrooms as { id?: string; name?: string; cycles?: { id?: string; name?: string } } | null
    const cycle = classroom?.cycles ?? null
    const paymentStatus = (student.payment_status as string | null) ?? 'Sin plan'

    return {
      id: student.id as string,
      code: (student.code as string | null) ?? '—',
      nombres: (student.nombres as string | null) ?? '',
      apellidos: (student.apellidos as string | null) ?? '',
      photoUrl: (student.photo_url as string | null) ?? null,
      estadoMatricula: (meta?.estado_matricula as string | null | undefined) ?? 'pendiente',
      classroomId: (classroom?.id as string | null | undefined) ?? null,
      classroomName: (classroom?.name as string | null | undefined) ?? null,
      cycleId: (cycle?.id as string | null | undefined) ?? null,
      cycleName: (cycle?.name as string | null | undefined) ?? null,
      debtAmount: Number(student.total_debt) || 0,
      debtStatus:
        paymentStatus === 'Al día'
          ? 'al_dia'
          : paymentStatus === 'En riesgo'
            ? 'moroso'
            : paymentStatus === 'Debe pagar'
              ? 'pendiente'
              : 'sin_plan',
    }
  })

  const cyclesMap = new Map<string, string>()
  const classroomsMap = new Map<string, string>()
  for (const r of rows) {
    if (r.cycleId && r.cycleName) cyclesMap.set(r.cycleId, r.cycleName)
    if (r.classroomId && r.classroomName) classroomsMap.set(r.classroomId, r.classroomName)
  }

  return (
    <StudentsTable
      rows={rows}
      cycles={Array.from(cyclesMap, ([id, name]) => ({ id, name }))}
      classrooms={Array.from(classroomsMap, ([id, name]) => ({ id, name }))}
    />
  )
}

export default function StudentsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Alumnos</h1>
          <p className="text-sm text-gray-500">Lista global de alumnos matriculados.</p>
        </div>
        <Link
          href="/students/nuevo"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98] sm:w-auto"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva matrícula
        </Link>
      </div>

      <Suspense fallback={<StudentsSkeleton />}>
        <StudentsData />
      </Suspense>
    </div>
  )
}
