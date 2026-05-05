'use server'

import { CreateStudentSchema, type CreateStudentInput } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'

export type CreateStudentWithPaymentInput = CreateStudentInput

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

export async function createStudentWithPayment(input: CreateStudentWithPaymentInput) {
  const parsed = CreateStudentSchema.parse(input)
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
  const studentCode = buildStudentCode(schoolId, parsed.dni || 'UNKNOWN')

  const studentPayload: Record<string, unknown> = {
    school_id: schoolId,
    code: studentCode,
    nombres: parsed.nombres,
    apellidos: parsed.apellidos,
    dni: parsed.dni && parsed.dni.trim() ? parsed.dni : null,
    email: parsed.email || null,
    cycle_id: parsed.cycle_id,
    classroom_id: parsed.classroom_id,
    estado_matricula: 'activo',
  }

  if (studentColumns.has('estado')) studentPayload.estado = 'activo'
  if (studentColumns.has('created_by')) studentPayload.created_by = user.id
  if (studentColumns.has('phone')) studentPayload.phone = parsed.telefono || null
  if (studentColumns.has('telefono')) studentPayload.telefono = parsed.telefono || null
  if (studentColumns.has('fecha_nacimiento')) studentPayload.fecha_nacimiento = parsed.fecha_nacimiento || null
  if (studentColumns.has('direccion')) studentPayload.direccion = parsed.direccion || null
  if (studentColumns.has('apoderado_nombre')) studentPayload.apoderado_nombre = parsed.apoderado_nombre || null
  if (studentColumns.has('apoderado_telefono')) studentPayload.apoderado_telefono = parsed.apoderado_telefono || null
  if (studentColumns.has('apoderado_email')) studentPayload.apoderado_email = parsed.apoderado_email || null
  if (studentColumns.has('observaciones')) studentPayload.observaciones = parsed.observaciones || null

  let studentInsert = await db
    .from('students')
    .insert(studentPayload)
    .select('id')
    .single()

  if (studentInsert.error && String(studentInsert.error.message).toLowerCase().includes('email')) {
    const { email, phone, telefono, ...fallbackPayload } = studentPayload
    void email
    void phone
    void telefono
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

  const enrollmentPayload = {
    school_id: schoolId,
    student_id: studentId,
    cycle_id: parsed.cycle_id,
    classroom_id: parsed.classroom_id,
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

  const totalAmount = parsed.selectedPlan.num_cuotas * parsed.selectedPlan.monto_por_cuota
  const planName = `${parsed.selectedPlan.num_cuotas} cuotas de S/ ${parsed.selectedPlan.monto_por_cuota.toFixed(2)}`
  const { data: paymentPlan, error: paymentPlanError } = await db
    .from('payment_plans')
    .insert({
      school_id: schoolId,
      student_id: studentId,
      cycle_id: parsed.cycle_id,
      name: planName,
      total_amount: totalAmount,
      status: 'activo',
    })
    .select('id')
    .single()

  if (paymentPlanError) {
    throw new Error(`PaymentPlan: ${paymentPlanError.message}`)
  }

  if (!paymentPlan?.id) {
    throw new Error('PaymentPlan: No se pudo crear el plan de pago.')
  }

  const paymentPlanId = paymentPlan.id as string
  const generatePayload = {
    p_payment_plan_id: paymentPlanId,
    p_num_installments: parsed.selectedPlan.num_cuotas,
    p_first_due_date: parsed.selectedPlan.fecha_primera_cuota,
    p_frequency_days: parsed.selectedPlan.frecuencia_dias,
  }

  const generateRes = await db.rpc('fn_generate_installments', generatePayload)

  if (generateRes.error) {
    throw new Error(`Installments: ${generateRes.error.message}`)
  }

  const receiptNumber = buildReceiptNumber()
  const paymentPayload = {
    school_id: schoolId,
    payment_plan_id: paymentPlanId,
    paid_at: new Date().toISOString(),
    receipt_number: receiptNumber,
    amount: parsed.primerPago.monto,
    method: parsed.primerPago.metodo,
    reference: parsed.primerPago.referencia ?? null,
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

  if (paymentInsert.error) {
    throw new Error(`Payment: ${paymentInsert.error.message}`)
  }

  if (!paymentInsert.data?.id) {
    throw new Error('Payment: No se pudo registrar el primer pago.')
  }

  const applyRes = await db.rpc('fn_apply_payment_to_oldest_installments', {
    p_payment_id: paymentInsert.data.id,
  })

  if (applyRes.error) {
    throw new Error(`Apply: ${applyRes.error.message}`)
  }

  return {
    student_id: studentId,
    first_enrollment_id: enrollmentId,
  }
}
