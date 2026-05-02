'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface CycleInput {
  name: string
  start_date: string | null
  end_date: string | null
}

async function getCurrentSchoolId() {
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

function normalizeInput(input: CycleInput) {
  return {
    name: input.name.trim(),
    start_date: input.start_date || null,
    end_date: input.end_date || null,
  }
}

export async function createCycle(input: CycleInput) {
  const { db, schoolId, userId } = await getCurrentSchoolId()
  const payload = normalizeInput(input)

  const { error } = await db.from('cycles').insert({
    ...payload,
    school_id: schoolId,
    created_by: userId,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un ciclo con ese nombre en este colegio.')
    }

    throw new Error(error.message)
  }

  revalidatePath('/ciclos')
}

export async function updateCycle(id: string, input: CycleInput) {
  const { db } = await getCurrentSchoolId()
  const payload = normalizeInput(input)

  const { error } = await db
    .from('cycles')
    .update(payload)
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un ciclo con ese nombre en este colegio.')
    }

    throw new Error(error.message)
  }

  revalidatePath('/ciclos')
}

export async function deleteCycle(id: string) {
  const { db } = await getCurrentSchoolId()

  const { error } = await db
    .from('cycles')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/ciclos')
}
