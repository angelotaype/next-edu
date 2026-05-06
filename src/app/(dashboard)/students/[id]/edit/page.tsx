import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditStudentForm from './EditStudentForm'

export const dynamic = 'force-dynamic'

async function getStudentForEdit(studentId: string) {
  const supabase = createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRaw } = await db
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const schoolId = (profileRaw as { school_id?: string } | null)?.school_id
  if (!schoolId) redirect('/login')

  const { data: student, error } = await db
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!student) {
    notFound()
  }

  return {
    nombres: (student.nombres as string | null) ?? '',
    apellidos: (student.apellidos as string | null) ?? '',
    dni: (student.dni as string | null) ?? null,
    fecha_nacimiento: (student.fecha_nacimiento as string | null) ?? null,
    telefono: (student.telefono as string | null) ?? null,
    email: (student.email as string | null) ?? null,
    direccion: (student.direccion as string | null) ?? null,
    apoderado_nombre: (student.apoderado_nombre as string | null) ?? null,
    apoderado_telefono: (student.apoderado_telefono as string | null) ?? null,
    apoderado_email: (student.apoderado_email as string | null) ?? null,
    observaciones: (student.observaciones as string | null) ?? null,
  }
}

export default async function EditStudentPage({
  params,
}: {
  params: { id: string }
}) {
  const student = await getStudentForEdit(params.id)

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-7 md:py-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Alumno</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Editar información</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
            Actualiza los datos personales, del apoderado y las observaciones del estudiante.
          </p>
        </div>
      </div>

      <EditStudentForm studentId={params.id} initialValues={student} />
    </div>
  )
}
