import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HistorialTable from './HistorialTable'

export const dynamic = 'force-dynamic'

export default async function HistorialPage() {
  const supabase = createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  const schoolId = (profile as { school_id?: string } | null)?.school_id

  if (profileError || !schoolId) {
    throw new Error('No se pudo resolver el colegio actual.')
  }

  const { data: payments, error: paymentsError } = await db
    .from('payments')
    .select('id, amount, method, paid_at, receipt_number, reference, payment_plan_id, created_by')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('paid_at', { ascending: false })

  if (paymentsError) {
    throw new Error(paymentsError.message)
  }

  const paymentRows = (payments ?? []) as Array<{
    id: string
    amount: number | string | null
    method: string | null
    paid_at: string
    receipt_number: string | null
    reference: string | null
    payment_plan_id: string | null
    created_by: string | null
  }>

  const paymentPlanIds = paymentRows
    .map((payment) => payment.payment_plan_id)
    .filter((value): value is string => Boolean(value))

  const { data: paymentPlans, error: paymentPlansError } = paymentPlanIds.length === 0
    ? { data: [], error: null }
    : await db
        .from('payment_plans')
        .select('id, student_id')
        .in('id', paymentPlanIds)

  if (paymentPlansError) {
    throw new Error(paymentPlansError.message)
  }

  const planToStudent = new Map<string, string>()
  for (const plan of (paymentPlans ?? []) as Array<{ id?: string | null; student_id?: string | null }>) {
    if (plan.id && plan.student_id) {
      planToStudent.set(plan.id, plan.student_id)
    }
  }

  const studentIds = Array.from(new Set(Array.from(planToStudent.values())))

  const { data: students, error: studentsError } = studentIds.length === 0
    ? { data: [], error: null }
    : await db
        .from('students')
        .select('id, nombres, apellidos, code')
        .in('id', studentIds)

  if (studentsError) {
    throw new Error(studentsError.message)
  }

  const studentMap = new Map<string, { nombres?: string | null; apellidos?: string | null; code?: string | null }>()
  for (const student of (students ?? []) as Array<{ id?: string | null; nombres?: string | null; apellidos?: string | null; code?: string | null }>) {
    if (student.id) {
      studentMap.set(student.id, student)
    }
  }

  const enriched = paymentRows.map((payment) => {
    const studentId = payment.payment_plan_id ? planToStudent.get(payment.payment_plan_id) ?? null : null
    const student = studentId ? studentMap.get(studentId) ?? null : null

    return {
      ...payment,
      amount: Number(payment.amount) || 0,
      student_nombre: student?.nombres ?? null,
      student_apellido: student?.apellidos ?? null,
      student_code: student?.code ?? null,
    }
  })

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.10),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-7 md:py-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Pagos</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Historial de pagos</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
            Revisa transacciones registradas y revierte pagos recientes dentro de la ventana de 24 horas.
          </p>
        </div>
      </div>

      <HistorialTable payments={enriched} />
    </div>
  )
}
