'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function revertPaymentAction(paymentId: string) {
  const supabase = createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Sesión inválida')
  }

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const schoolId = (profile as { school_id?: string } | null)?.school_id

  if (profileError || !schoolId) {
    throw new Error('No se pudo resolver colegio')
  }

  const { data: payment, error: paymentError } = await db
    .from('payments')
    .select('id, school_id, paid_at')
    .eq('id', paymentId)
    .is('deleted_at', null)
    .single()

  if (paymentError || !payment || payment.school_id !== schoolId) {
    throw new Error('Pago no encontrado')
  }

  const { data: result, error } = await db.rpc('fn_revert_payment', {
    p_payment_id: paymentId,
  })

  if (error) {
    throw new Error(error.message)
  }

  if ((result as { error?: string } | null)?.error) {
    throw new Error((result as { error: string }).error)
  }

  revalidatePath('/pagos/historial')
  revalidatePath('/dashboard')
  revalidatePath('/pagos/rapido')
  revalidatePath('/morosos')

  return result
}
