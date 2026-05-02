'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { createStudentWithPlan } from './actions'

const STORAGE_KEY = 'next-edu:student-wizard'

const wizardSchema = z.object({
  name: z.string().trim().min(3, 'Ingresa al menos 3 caracteres.').max(120, 'Máximo 120 caracteres.'),
  email: z.string().trim().email('Correo inválido.').nullable(),
  phone: z.string().trim().max(30, 'Máximo 30 caracteres.').nullable(),
  documento: z.string().trim().max(30, 'Máximo 30 caracteres.').nullable(),
  cycle_id: z.string().uuid('Selecciona un ciclo válido.'),
  classroom_id: z.string().uuid('Selecciona un salón válido.'),
  payment_plan_id: z.string().uuid('Selecciona un plan de pago válido.'),
  payment_frequency: z.enum(['monthly', 'quarterly', 'yearly']),
})

type WizardValues = z.infer<typeof wizardSchema>

interface CycleOption {
  id: string
  name: string
}

interface ClassroomOption {
  id: string
  name: string
  cycle_id: string
  tipo: string | null
  nivel: string | null
}

interface PaymentPlanOption {
  id: string
  name: string
  monthly_fee: number | null
  total_fee: number | null
}

interface WizardFormProps {
  cycles: CycleOption[]
  classrooms: ClassroomOption[]
  paymentPlans: PaymentPlanOption[]
}

const STEPS = [
  { number: 1, label: 'Datos', fields: ['name', 'email', 'phone', 'documento'] as const },
  { number: 2, label: 'Ciclo', fields: ['cycle_id'] as const },
  { number: 3, label: 'Salón', fields: ['classroom_id'] as const },
  { number: 4, label: 'Plan', fields: ['payment_plan_id', 'payment_frequency'] as const },
] as const

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-max items-center gap-2 sm:gap-3">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.number
          const isDone = currentStep > step.number

          return (
            <div key={step.number} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-2 shadow-sm sm:px-3">
                <div
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                    isDone ? 'bg-green-600 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500',
                  ].join(' ')}
                >
                  {step.number}
                </div>
                <span className={['text-sm font-medium', isActive ? 'text-gray-900' : 'text-gray-500'].join(' ')}>
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && <div className="h-px w-6 bg-gray-300 sm:w-10" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function WizardForm({ cycles, classrooms, paymentPlans }: WizardFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    watch,
    setValue,
    getValues,
    trigger,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      name: '',
      email: null,
      phone: null,
      documento: null,
      cycle_id: '',
      classroom_id: '',
      payment_plan_id: '',
      payment_frequency: 'monthly',
    },
  })

  const selectedCycleId = watch('cycle_id')
  const selectedPlanId = watch('payment_plan_id')

  const availableClassrooms = useMemo(
    () => classrooms.filter((classroom) => classroom.cycle_id === selectedCycleId),
    [classrooms, selectedCycleId]
  )

  const selectedPlan = useMemo(
    () => paymentPlans.find((plan) => plan.id === selectedPlanId) ?? null,
    [paymentPlans, selectedPlanId]
  )

  useEffect(() => {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)

    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as { step?: number; values?: Partial<WizardValues> }
      if (parsed.values) {
        reset({
          ...getValues(),
          ...parsed.values,
        })
      }

      if (parsed.step && parsed.step >= 1 && parsed.step <= 4) {
        setCurrentStep(parsed.step)
      }
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [getValues, reset])

  useEffect(() => {
    const subscription = watch((values) => {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step: currentStep,
          values,
        })
      )
    })

    return () => subscription.unsubscribe()
  }, [currentStep, watch])

  useEffect(() => {
    const selectedClassroomId = getValues('classroom_id')
    if (selectedClassroomId && !availableClassrooms.some((classroom) => classroom.id === selectedClassroomId)) {
      setValue('classroom_id', '')
    }
  }, [availableClassrooms, getValues, setValue])

  async function handleNext() {
    const fields = STEPS[currentStep - 1].fields as unknown as Parameters<typeof trigger>[0]
    const isValid = await trigger(fields)

    if (!isValid) return
    setCurrentStep((step) => Math.min(step + 1, 4))
  }

  function handlePrev() {
    setCurrentStep((step) => Math.max(step - 1, 1))
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      try {
        const result = await createStudentWithPlan(values)

        window.sessionStorage.removeItem(STORAGE_KEY)

        toast.success('Alumno matriculado', {
          description: 'La matrícula fue registrada correctamente.',
        })

        router.push(`/students/${result.student_id}`)
        router.refresh()
      } catch (error) {
        toast.error('No se pudo completar la matrícula', {
          description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        })
      }
    })
  })

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-7 md:py-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Matrícula guiada</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Nuevo estudiante</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
            Completa los 4 pasos para registrar al estudiante, asignarlo a un ciclo y vincular su plan de pago.
          </p>
        </div>
      </div>

      <Stepper currentStep={currentStep} />

      <form onSubmit={onSubmit} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        {currentStep === 1 && (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                placeholder="Ej. Juan Pérez"
                className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                placeholder="Opcional"
                className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                {...register('email', { setValueAs: (value) => value?.trim() ? value.trim() : null })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="phone"
                type="text"
                placeholder="Opcional"
                className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                {...register('phone', { setValueAs: (value) => value?.trim() ? value.trim() : null })}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="documento" className="mb-1.5 block text-sm font-medium text-gray-700">
                Documento
              </label>
              <input
                id="documento"
                type="text"
                placeholder="Opcional"
                className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                {...register('documento', { setValueAs: (value) => value?.trim() ? value.trim() : null })}
              />
              {errors.documento && <p className="mt-1 text-xs text-red-600">{errors.documento.message}</p>}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
            <label htmlFor="cycle_id" className="mb-1.5 block text-sm font-medium text-gray-700">
              Ciclo activo
            </label>
            <select
              id="cycle_id"
              className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              {...register('cycle_id')}
            >
              <option value="">Selecciona un ciclo</option>
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
              ))}
            </select>
            {errors.cycle_id && <p className="mt-1 text-xs text-red-600">{errors.cycle_id.message}</p>}
          </div>
        )}

        {currentStep === 3 && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
            <label htmlFor="classroom_id" className="mb-1.5 block text-sm font-medium text-gray-700">
              Salón del ciclo
            </label>
            <select
              id="classroom_id"
              className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              {...register('classroom_id')}
              disabled={!selectedCycleId}
            >
              <option value="">{selectedCycleId ? 'Selecciona un salón' : 'Primero selecciona un ciclo'}</option>
              {availableClassrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} {classroom.tipo ? `· ${classroom.tipo}` : ''} {classroom.nivel ? `· ${classroom.nivel}` : ''}
                </option>
              ))}
            </select>
            {errors.classroom_id && <p className="mt-1 text-xs text-red-600">{errors.classroom_id.message}</p>}
          </div>
        )}

        {currentStep === 4 && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
              <label htmlFor="payment_plan_id" className="mb-1.5 block text-sm font-medium text-gray-700">
                Plan de pago
              </label>
              <select
                id="payment_plan_id"
                className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                {...register('payment_plan_id')}
              >
                <option value="">Selecciona un plan</option>
                {paymentPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              {errors.payment_plan_id && <p className="mt-1 text-xs text-red-600">{errors.payment_plan_id.message}</p>}

              <label htmlFor="payment_frequency" className="mb-1.5 mt-5 block text-sm font-medium text-gray-700">
                Frecuencia de pago
              </label>
              <select
                id="payment_frequency"
                className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                {...register('payment_frequency')}
              >
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
              {errors.payment_frequency && <p className="mt-1 text-xs text-red-600">{errors.payment_frequency.message}</p>}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Referencia</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Cuota mensual</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {selectedPlan?.monthly_fee != null
                      ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(selectedPlan.monthly_fee)
                      : '—'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Costo total</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {selectedPlan?.total_fee != null
                      ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(selectedPlan.total_fee)
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1 || isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Crear matrícula
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
