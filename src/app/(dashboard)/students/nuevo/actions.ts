'use server'

import { createClient } from '@/lib/supabase/server'

export interface CreateStudentWithPlanInput {
  name: string
  email: string | null
  phone: string | null
  documento: string | null
  cycle_id: string
  classroom_id: string
  payment_plan_id: string
  payment_frequency: 'monthly' | 'quarterly' | 'yearly'
}

export async function createStudentWithPlan(input: CreateStudentWithPlanInput) {
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

  const payload = {
    school_id: schoolId,
    name: input.name.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    documento: input.documento?.trim() || null,
    cycle_id: input.cycle_id,
    classroom_id: input.classroom_id,
    payment_plan_id: input.payment_plan_id,
    payment_frequency: input.payment_frequency,
  }

  const { data, error } = await db.rpc('fn_create_student_with_plan', payload)

  if (error) {
    throw new Error(error.message)
  }

  const result = Array.isArray(data) ? data[0] : data

  if (!result?.student_id) {
    throw new Error('La RPC no devolvió el estudiante creado.')
  }

  return {
    student_id: result.student_id as string,
    first_enrollment_id: (result.first_enrollment_id as string | null) ?? null,
  }
}
