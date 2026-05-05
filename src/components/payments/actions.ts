'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const quickPaymentSchema = z.object({
  studentId: z.string().uuid('Alumno inválido.'),
  amount: z.number().min(0.01, 'Ingresa un monto mayor a 0.').max(99999.99, 'Monto fuera de rango.'),
  method: z.enum(['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta']),
  reference: z.string().trim().max(50, 'Máximo 50 caracteres.').nullable(),
})

export type QuickPaymentInput = z.infer<typeof quickPaymentSchema>

function buildReceiptNumber() {
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `RP-${stamp}-${random}`
}

export async function createQuickPayment(input: QuickPaymentInput) {
  const parsed = quickPaymentSchema.parse(input)

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

  const { data: student, error: studentError } = await db
    .from('students')
    .select('id, nombres, apellidos')
    .eq('id', parsed.studentId)
    .single()

  if (studentError || !student) {
    throw new Error('No se pudo resolver el alumno.')
  }

  const { data: enrollments, error: enrollmentsError } = await db
    .from('enrollments')
    .select('*')
    .eq('student_id', parsed.studentId)
    .order('created_at', { ascending: false })

  if (enrollmentsError) {
    throw new Error(enrollmentsError.message)
  }

  const enrollmentRows = (enrollments ?? []) as any[]
  const enrollmentIds = enrollmentRows
    .map((row) => row.id as string | null | undefined)
    .filter((value): value is string => Boolean(value))

  if (enrollmentIds.length === 0) {
    throw new Error('El alumno no tiene matrículas asociadas.')
  }

  const baseEnrollment = enrollmentRows[0] ?? null

  let paymentPlanId =
    (baseEnrollment?.payment_plan_id as string | null | undefined)
    ?? (baseEnrollment?.plan_id as string | null | undefined)
    ?? null

  if (!paymentPlanId) {
    const { data: fallbackPlan, error: fallbackPlanError } = await db
      .from('payment_plans')
      .select('id')
      .eq('student_id', parsed.studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fallbackPlanError) {
      throw new Error(fallbackPlanError.message)
    }

    paymentPlanId = (fallbackPlan as { id?: string } | null)?.id ?? null
  }

  if (!paymentPlanId) {
    throw new Error('No se pudo resolver el plan de pago del alumno.')
  }

  const receiptNumber = buildReceiptNumber()
  const paidAt = new Date().toISOString()

  const insertPayload = {
    school_id: schoolId,
    student_id: parsed.studentId,
    payment_plan_id: paymentPlanId,
    paid_at: paidAt,
    receipt_number: receiptNumber,
    amount: parsed.amount,
    method: parsed.method,
    reference: parsed.reference || null,
    status: 'completed',
    created_by: user.id,
  }

  const { data: payment, error: paymentError } = await db
    .from('payments')
    .insert(insertPayload)
    .select('id, receipt_number, amount, paid_at, method')
    .single()

  if (paymentError) {
    throw new Error(paymentError.message)
  }

  const { data: applyResult, error: applyError } = await db.rpc('fn_apply_payment_to_oldest_installments', {
    p_payment_id: payment.id,
  })

  if (applyError) {
    throw new Error(applyError.message)
  }

  const creditRemaining = Number((applyResult as { credit_remaining?: number | string } | null)?.credit_remaining) || 0

  return {
    paymentId: payment.id as string,
    receiptNumber: (payment.receipt_number as string | null) ?? receiptNumber,
    amount: Number(payment.amount) || parsed.amount,
    paidAt: (payment.paid_at as string | null) ?? paidAt,
    method: (payment.method as string | null) ?? parsed.method,
    studentName: `${(student.apellidos as string | null) ?? ''}, ${(student.nombres as string | null) ?? ''}`.trim().replace(/^,\s*/, ''),
    creditRemaining,
  }
}
