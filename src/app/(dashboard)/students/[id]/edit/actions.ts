'use server'

import { StudentProfileSchema, type StudentProfileInput } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'

async function getStudentColumnSet(db: any) {
  const { data, error } = await db
    .from('students')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`StudentsSchema: ${error.message}`)
  }

  return new Set(Object.keys((data as Record<string, unknown> | null) ?? {}))
}

export async function updateStudent(studentId: string, input: StudentProfileInput) {
  const parsed = StudentProfileSchema.parse(input)
  const supabase = createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Sesión no válida.')
  }

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const schoolId = (profile as { school_id?: string } | null)?.school_id
  if (profileError || !schoolId) {
    throw new Error('No se pudo resolver el colegio actual.')
  }

  const studentColumns = await getStudentColumnSet(db)
  const updatePayload: Record<string, unknown> = {
    nombres: parsed.nombres,
    apellidos: parsed.apellidos,
    dni: parsed.dni,
    email: parsed.email,
  }

  if (studentColumns.has('telefono')) updatePayload.telefono = parsed.telefono
  if (studentColumns.has('fecha_nacimiento')) updatePayload.fecha_nacimiento = parsed.fecha_nacimiento
  if (studentColumns.has('direccion')) updatePayload.direccion = parsed.direccion
  if (studentColumns.has('apoderado_nombre')) updatePayload.apoderado_nombre = parsed.apoderado_nombre
  if (studentColumns.has('apoderado_telefono')) updatePayload.apoderado_telefono = parsed.apoderado_telefono
  if (studentColumns.has('apoderado_email')) updatePayload.apoderado_email = parsed.apoderado_email
  if (studentColumns.has('observaciones')) updatePayload.observaciones = parsed.observaciones

  const { error } = await db
    .from('students')
    .update(updatePayload)
    .eq('id', studentId)
    .eq('school_id', schoolId)

  if (error) {
    throw new Error(error.message)
  }
}
