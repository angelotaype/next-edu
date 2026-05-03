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

function buildStudentCode(schoolId: string, dni: string): string {
  const schoolPrefix = schoolId.slice(0, 3).toUpperCase()
  const dniSuffix = dni.slice(-4)
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ALU-${schoolPrefix}-${dniSuffix}-${timestamp}${random}`
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
      return '3 months'
    case 'yearly':
      return '1 year'
    case 'monthly':
    default:
      return '1 month'
  }
}

function splitStudentName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return { nombres: 'Alumno', apellidos: 'Sin apellido' }
  }

  if (parts.length === 1) {
    return { nombres: parts[0], apellidos: 'Sin apellido' }
  }

  return {
    nombres: parts.slice(0, -1).join(' '),
    apellidos: parts.at(-1) ?? 'Sin apellido',
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
  console.log('🟢 [1] schoolId:', schoolId)
  const { nombres, apellidos } = splitStudentName(input.name)
  const studentCode = buildStudentCode(schoolId, input.dni || 'UNKNOWN')

  const studentPayload = {
    school_id: schoolId,
    code: studentCode,
    nombres,
    apellidos,
    dni: input.dni?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    cycle_id: input.cycle_id,
    classroom_id: input.classroom_id,
    estado_matricula: 'activo',
  }

  let studentInsert = await db
    .from('students')
    .insert(studentPayload)
    .select('id')
    .single()

  if (studentInsert.error && String(studentInsert.error.message).toLowerCase().includes('email')) {
    const { email, phone, ...fallbackPayload } = studentPayload
    void email
    void phone
    studentInsert = await db
      .from('students')
      .insert(fallbackPayload)
      .select('id')
      .single()
  }

  if (studentInsert.error || !studentInsert.data?.id) {
    throw new Error(studentInsert.error?.message ?? 'No se pudo crear el estudiante.')
  }

  const studentId = studentInsert.data.id as string
  console.log('🟢 [2] Student created:', studentId)

  const enrollmentPayload = {
    school_id: schoolId,
    student_id: studentId,
    cycle_id: input.cycle_id,
    classroom_id: input.classroom_id,
    created_by: user.id,
  }

  let enrollmentInsert = await db
    .from('enrollments')
    .insert(enrollmentPayload)
    .select('id')
    .single()

  if (enrollmentInsert.error && String(enrollmentInsert.error.message).toLowerCase().includes('created_by')) {
    const { created_by, ...fallbackPayload } = enrollmentPayload
    void created_by
    enrollmentInsert = await db
      .from('enrollments')
      .insert(fallbackPayload)
      .select('id')
      .single()
  }

  const enrollmentId = (enrollmentInsert.data?.id as string | undefined) ?? null

  if (enrollmentInsert.error || !enrollmentId) {
    throw new Error(enrollmentInsert.error?.message ?? 'No se pudo crear la matrícula.')
  }
  console.log('🟢 [3] Enrollment created:', enrollmentId)

  const planName = `${input.selectedPlan.installments} cuotas de S/ ${input.selectedPlan.monthlyAmount.toFixed(2)}`
  console.log('🟢 [4] Payment plan input:', input.selectedPlan)
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
  console.log('🟢 [5] Payment plan result:', { paymentPlan, paymentPlanError })

  if (paymentPlanError) {
    throw new Error(`PaymentPlan: ${paymentPlanError.message}`)
  }

  if (!paymentPlan?.id) {
    throw new Error('PaymentPlan: No se pudo crear el plan de pago.')
  }

  const paymentPlanId = paymentPlan.id as string
  const generatePayload = {
    p_payment_plan_id: paymentPlanId,
    p_num_installments: input.selectedPlan.installments,
    p_first_due_date: getFirstDueDate(),
    p_frequency: getFrequencyInterval(input.payment_frequency),
  }
  console.log('🟢 [6] Calling fn_generate_installments with:', generatePayload)

  const generateRes = await db.rpc('fn_generate_installments', generatePayload)
  console.log('🟢 [7] Generate installments result:', generateRes)

  if (generateRes.error) {
    throw new Error(`Installments: ${generateRes.error.message}`)
  }

  const receiptNumber = buildReceiptNumber()
  console.log('🟢 [8] Primer pago input:', input.primerPago)
  const paymentPayload = {
    school_id: schoolId,
    payment_plan_id: paymentPlanId,
    paid_at: new Date().toISOString(),
    receipt_number: receiptNumber,
    amount: input.primerPago.monto,
    method: input.primerPago.metodo,
    reference: input.primerPago.referencia?.trim() || null,
    is_quick_payment: true,
    scanned_by: user.id,
    created_by: user.id,
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
  console.log('🟢 [9] Payment insert result:', paymentInsert)

  if (paymentInsert.error) {
    throw new Error(`Payment: ${paymentInsert.error.message}`)
  }

  if (!paymentInsert.data?.id) {
    throw new Error('Payment: No se pudo registrar el primer pago.')
  }

  const applyRes = await db.rpc('fn_apply_payment_to_oldest_installments', {
    p_payment_id: paymentInsert.data.id,
  })
  console.log('🟢 [10] Apply payment FIFO result:', applyRes)

  if (applyRes.error) {
    throw new Error(`Apply: ${applyRes.error.message}`)
  }

  return {
    student_id: studentId,
    first_enrollment_id: enrollmentId,
  }
}
