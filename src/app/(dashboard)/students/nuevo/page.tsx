import { createClient } from '@/lib/supabase/server'
import WizardForm from './WizardForm'

export const dynamic = 'force-dynamic'

function toCurrencyValue(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

async function getWizardData() {
  const supabase = createClient()
  const db = supabase as any

  const [cyclesRes, classroomsRes, paymentPlansRes] = await Promise.all([
    db
      .from('cycles')
      .select('id, name')
      .is('deleted_at', null)
      .order('start_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    db
      .from('classrooms')
      .select('id, name, cycle_id, tipo, nivel')
      .is('deleted_at', null)
      .order('name', { ascending: true }),
    db
      .from('payment_plans')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  if (cyclesRes.error) throw new Error(cyclesRes.error.message)
  if (classroomsRes.error) throw new Error(classroomsRes.error.message)
  if (paymentPlansRes.error) throw new Error(paymentPlansRes.error.message)

  const cycles = ((cyclesRes.data ?? []) as any[]).map((cycle) => ({
    id: cycle.id as string,
    name: (cycle.name as string) ?? 'Sin nombre',
  }))

  const classrooms = ((classroomsRes.data ?? []) as any[]).map((classroom) => ({
    id: classroom.id as string,
    name: (classroom.name as string) ?? 'Sin nombre',
    cycle_id: classroom.cycle_id as string,
    tipo: (classroom.tipo as string | null) ?? null,
    nivel: (classroom.nivel as string | null) ?? null,
  }))

  const paymentPlans = ((paymentPlansRes.data ?? []) as any[]).map((plan, index) => ({
    id: plan.id as string,
    name: (plan.name as string | null)
      ?? (plan.plan_name as string | null)
      ?? `Plan ${index + 1}`,
    monthly_fee: toCurrencyValue(plan.monthly_fee ?? plan.installment_amount ?? plan.amount),
    total_fee: toCurrencyValue(plan.total_fee ?? plan.total_amount ?? plan.amount),
  }))

  return { cycles, classrooms, paymentPlans }
}

export default async function NuevoStudentPage() {
  const { cycles, classrooms, paymentPlans } = await getWizardData()

  return <WizardForm cycles={cycles} classrooms={classrooms} paymentPlans={paymentPlans} />
}
