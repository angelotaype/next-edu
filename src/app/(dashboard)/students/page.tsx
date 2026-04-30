import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
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

  const [studentsRes, debtRes] = await Promise.all([
    supabase
      .from('students')
      .select(`
        id, student_code, nombres, apellidos, estado_matricula, photo_url,
        classroom_id,
        classrooms ( id, name, cycle_id, cycles ( id, name ) )
      `)
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('apellidos', { ascending: true }),
    supabase
      .from('student_debt_summary')
      .select('student_id, debt_amount, debt_status')
      .eq('school_id', schoolId),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawStudents = (studentsRes.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debtList = (debtRes.data ?? []) as any[]

  const debtMap = new Map<string, { amount: number; status: string }>()
  for (const d of debtList) {
    debtMap.set(d.student_id, {
      amount: Number(d.debt_amount) || 0,
      status: d.debt_status || 'sin_plan',
    })
  }

  const rows: StudentRow[] = rawStudents.map((s) => {
    const classroom = s.classrooms as { id?: string; name?: string; cycles?: { id?: string; name?: string } } | null
    const cycle = classroom?.cycles ?? null
    const debt = debtMap.get(s.id) ?? { amount: 0, status: 'sin_plan' }
    return {
      id: s.id,
      code: s.student_code ?? '—',
      nombres: s.nombres ?? '',
      apellidos: s.apellidos ?? '',
      photoUrl: s.photo_url ?? null,
      estadoMatricula: s.estado_matricula ?? 'pendiente',
      classroomId: classroom?.id ?? null,
      classroomName: classroom?.name ?? null,
      cycleId: cycle?.id ?? null,
      cycleName: cycle?.name ?? null,
      debtAmount: debt.amount,
      debtStatus: debt.status,
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Alumnos</h1>
              <p className="text-sm text-gray-500">Lista global de alumnos matriculados.</p>
            </div>
            <Link
              href="/students/nuevo"
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva matrícula
            </Link>
          </div>

          <Suspense fallback={<StudentsSkeleton />}>
            <StudentsData />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
