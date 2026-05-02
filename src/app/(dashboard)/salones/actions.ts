'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ClassroomInput {
  name: string
  cycle_id: string
  tipo: string
  nivel: string
}

async function getCurrentContext() {
  const supabase = createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Sesión no válida.')
  }

  const { data: profile, error } = await db
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const profileData = profile as { school_id?: string } | null

  if (error || !profileData?.school_id) {
    throw new Error('No se pudo resolver el colegio actual.')
  }

  return { db, schoolId: profileData.school_id, userId: user.id }
}

function normalizeInput(input: ClassroomInput) {
  return {
    name: input.name.trim(),
    cycle_id: input.cycle_id,
    tipo: input.tipo.trim(),
    nivel: input.nivel.trim(),
  }
}

export async function createClassroom(input: ClassroomInput) {
  const { db, schoolId, userId } = await getCurrentContext()
  const payload = normalizeInput(input)

  const { error } = await db.from('classrooms').insert({
    ...payload,
    school_id: schoolId,
    created_by: userId,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un salón con esos datos en este colegio.')
    }

    throw new Error(error.message)
  }

  revalidatePath('/salones')
}

export async function updateClassroom(id: string, input: ClassroomInput) {
  const { db } = await getCurrentContext()
  const payload = normalizeInput(input)

  const { error } = await db
    .from('classrooms')
    .update(payload)
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un salón con esos datos en este colegio.')
    }

    throw new Error(error.message)
  }

  revalidatePath('/salones')
}

export async function deleteClassroom(id: string) {
  const { db } = await getCurrentContext()

  const { error } = await db
    .from('classrooms')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/salones')
}
