'use server'

import { createClient } from '@/lib/supabase/server'

export interface CreateStudentWithPaymentInput {
  name: string
  email: string | null
  phone: string | null
  dni: string | null
  cycle_id: string
  classroom_id: string
  selectedPlan: {
    templateId: string
    installments: number
    monthlyAmount: number
    totalAmount: number
  }
  payment_frequency: 'monthly' | 'quarterly' | 'yearly'
  primerPago: {
    monto: number
    metodo: 'efectivo' | 'yape' | 'plin' | 'transferencia'
    referencia?: string
  }
}

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
  return `MT-${stamp}-${random}`
}

function getFirstDueDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getDate() <= 20 ? now.getMonth() : now.getMonth() + 1
  return new Date(year, month, 20).toISOString().slice(0, 10)
}

function getFrequencyInterval(frequency: CreateStudentWithPaymentInput['payment_frequency']) {
  switch (frequency) {
    case 'quarterly':
      return "interval '3 month'"
    case 'yearly':
      return "interval '1 year'"
    case 'monthly':
    default:
      return "interval '1 month'"
  }
}

export async function createStudentWithPayment(input: CreateStudentWithPaymentInput) {
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
    dni: input.dni?.trim() || null,
    cycle_id: input.cycle_id,
    classroom_id: input.classroom_id,
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

  const studentId = result.student_id as string
  let enrollmentId = (result.first_enrollment_id as string | null) ?? null

  if (!enrollmentId) {
    const { data: enrollment, error: enrollmentError } = await db
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (enrollmentError) {
      throw new Error(enrollmentError.message)
    }

    enrollmentId = (enrollment as { id?: string } | null)?.id ?? null
  }

  if (!enrollmentId) {
    throw new Error('No se pudo resolver la matrícula creada.')
  }

  const planName = `${input.selectedPlan.installments} cuotas de S/ ${input.selectedPlan.monthlyAmount.toFixed(2)}`
  const { data: paymentPlan, error: paymentPlanError } = await db
    .from('payment_plans')
    .insert({
      school_id: schoolId,
      student_id: studentId,
      cycle_id: input.cycle_id,
      name: planName,
      total_amount: input.selectedPlan.totalAmount,
      status: 'activo',
    })
    .select('id')
    .single()

  if (paymentPlanError || !paymentPlan?.id) {
    throw new Error(paymentPlanError?.message ?? 'No se pudo crear el plan de pago.')
  }

  const paymentPlanId = paymentPlan.id as string

  const { error: generateError } = await db.rpc('fn_generate_installments', {
    p_payment_plan_id: paymentPlanId,
    p_num_installments: input.selectedPlan.installments,
    p_first_due_date: getFirstDueDate(),
    p_frequency: getFrequencyInterval(input.payment_frequency),
  })

  if (generateError) {
    throw new Error(generateError.message)
  }

  const receiptNumber = buildReceiptNumber()
  const paymentPayload = {
    school_id: schoolId,
    student_id: studentId,
    enrollment_id: enrollmentId,
    payment_plan_id: paymentPlanId,
    paid_at: new Date().toISOString(),
    receipt_number: receiptNumber,
    amount: input.primerPago.monto,
    method: input.primerPago.metodo,
    reference: input.primerPago.referencia?.trim() || null,
    status: 'completed',
    created_by: user.id,
    is_quick_payment: true,
  }

  let paymentInsert = await db
    .from('payments')
    .insert(paymentPayload)
    .select('id')
    .single()

  if (paymentInsert.error && String(paymentInsert.error.message).toLowerCase().includes('is_quick_payment')) {
    const { is_quick_payment, ...fallbackPayload } = paymentPayload
    void is_quick_payment
    paymentInsert = await db
      .from('payments')
      .insert(fallbackPayload)
      .select('id')
      .single()
  }

  if (paymentInsert.error || !paymentInsert.data?.id) {
    throw new Error(paymentInsert.error?.message ?? 'No se pudo registrar el primer pago.')
  }

  const { error: applyError } = await db.rpc('fn_apply_payment_to_oldest_installments', {
    payment_id: paymentInsert.data.id,
  })

  if (applyError) {
    throw new Error(applyError.message)
  }

  return {
    student_id: studentId,
    first_enrollment_id: enrollmentId,
  }
}
