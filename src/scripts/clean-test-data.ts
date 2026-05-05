import { createClient } from '@supabase/supabase-js'

const KEEP_STUDENT_CODE = 'ALU001'

type RowWithId = { id: string }

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

async function deleteByIds(
  supabase: ReturnType<typeof createClient>,
  table: string,
  column: string,
  ids: string[]
) {
  if (ids.length === 0) return 0

  const { error, count } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .in(column, ids)

  if (error) {
    throw new Error(`Failed to delete from ${table}: ${error.message}`)
  }

  return count ?? ids.length
}

async function main() {
  const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: keeper, error: keeperError } = await supabase
    .from('students')
    .select('id, code')
    .eq('code', KEEP_STUDENT_CODE)
    .is('deleted_at', null)
    .maybeSingle<RowWithId & { code: string }>()

  if (keeperError) {
    throw new Error(`Failed to resolve keeper student ${KEEP_STUDENT_CODE}: ${keeperError.message}`)
  }

  if (!keeper) {
    throw new Error(`Keeper student ${KEEP_STUDENT_CODE} was not found. Aborting cleanup.`)
  }

  const { data: doomedStudents, error: studentsError } = await supabase
    .from('students')
    .select('id')
    .neq('id', keeper.id)
    .is('deleted_at', null)
    .returns<RowWithId[]>()

  if (studentsError) {
    throw new Error(`Failed to list students to delete: ${studentsError.message}`)
  }

  const studentIds = (doomedStudents ?? []).map((student) => student.id)

  if (studentIds.length === 0) {
    console.log(`No test students found. Keeper ${KEEP_STUDENT_CODE} remains untouched.`)
    return
  }

  const [{ data: enrollments, error: enrollmentsError }, { data: paymentPlans, error: paymentPlansError }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id')
      .in('student_id', studentIds)
      .returns<RowWithId[]>(),
    supabase
      .from('payment_plans')
      .select('id')
      .in('student_id', studentIds)
      .returns<RowWithId[]>(),
  ])

  if (enrollmentsError) {
    throw new Error(`Failed to list enrollments to delete: ${enrollmentsError.message}`)
  }

  if (paymentPlansError) {
    throw new Error(`Failed to list payment plans to delete: ${paymentPlansError.message}`)
  }

  const enrollmentIds = (enrollments ?? []).map((enrollment) => enrollment.id)
  const paymentPlanIds = (paymentPlans ?? []).map((plan) => plan.id)

  const deletedPayments = await deleteByIds(supabase, 'payments', 'payment_plan_id', paymentPlanIds)
  const deletedInstallments = await deleteByIds(supabase, 'installments', 'enrollment_id', enrollmentIds)
  const deletedAttendanceLogs = await deleteByIds(supabase, 'attendance_logs', 'student_id', studentIds)
  const deletedPaymentPlans = await deleteByIds(supabase, 'payment_plans', 'id', paymentPlanIds)
  const deletedEnrollments = await deleteByIds(supabase, 'enrollments', 'id', enrollmentIds)
  const deletedStudents = await deleteByIds(supabase, 'students', 'id', studentIds)

  console.log(
    JSON.stringify(
      {
        keeperCode: KEEP_STUDENT_CODE,
        deletedStudents,
        deletedEnrollments,
        deletedPaymentPlans,
        deletedPayments,
        deletedInstallments,
        deletedAttendanceLogs,
      },
      null,
      2
    )
  )
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
