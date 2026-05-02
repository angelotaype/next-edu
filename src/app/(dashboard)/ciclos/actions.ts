'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CicloEstado } from './types'

export interface CycleInput {
  name: string
  ano: number
  fecha_inicio: string | null
  fecha_fin: string | null
  estado: CicloEstado
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

  return { db, schoolId: profileData.school_id }
}

function normalizeInput(input: CycleInput) {
  return {
    name: input.name.trim(),
    ano: input.ano,
    fecha_inicio: input.fecha_inicio || null,
    fecha_fin: input.fecha_fin || null,
    estado: input.estado,
  }
}

export async function createCycle(input: CycleInput) {
  const { db, schoolId } = await getCurrentSchoolId()
  const payload = normalizeInput(input)

  const { error } = await db.from('cycles').insert({
    ...payload,
    school_id: schoolId,
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
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/ciclos')
}
