'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { CreateStudentSchema, type CreateStudentInput } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/client'
import { createStudentWithPayment } from './actions'

const STORAGE_KEY = 'next-edu:student-wizard'

type WizardValues = CreateStudentInput
type WizardFormValues = z.input<typeof CreateStudentSchema>

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

interface WizardFormProps {
  cycles: CycleOption[]
  classrooms: ClassroomOption[]
}

const STEPS = [
  { number: 1, label: 'Datos', fields: ['nombres', 'apellidos', 'dni', 'fecha_nacimiento', 'telefono', 'email', 'direccion', 'apoderado_nombre', 'apoderado_telefono', 'apoderado_email', 'observaciones'] as const },
  { number: 2, label: 'Ciclo', fields: ['cycle_id'] as const },
  { number: 3, label: 'Salón', fields: ['classroom_id'] as const },
  { number: 4, label: 'Plan', fields: ['selectedPlan.num_cuotas', 'selectedPlan.monto_por_cuota', 'selectedPlan.frecuencia_dias', 'selectedPlan.fecha_primera_cuota'] as const },
  { number: 5, label: 'Pago', fields: ['primerPago.monto', 'primerPago.metodo', 'primerPago.referencia'] as const },
] as const

function formatCurrency(value: number | null) {
  if (value == null) return '—'

  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value)
}

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-3 sm:min-w-max sm:flex-row sm:items-center sm:gap-3">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.number
          const isDone = currentStep > step.number

          return (
            <div key={step.number} className="flex items-center gap-3 sm:gap-2">
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
              {index < STEPS.length - 1 && <div className="h-6 w-px bg-gray-300 sm:h-px sm:w-10" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function WizardForm({ cycles, classrooms }: WizardFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isPending, startTransition] = useTransition()
  const isLoading = isPending
  const [numCuotas, setNumCuotas] = useState(6)
  const [montoPorCuota, setMontoPorCuota] = useState(120)
  const [frecuenciaDias, setFrecuenciaDias] = useState(30)
  const [diasCustom, setDiasCustom] = useState(7)
  const [fechaPrimera, setFechaPrimera] = useState(() => new Date().toISOString().split('T')[0] ?? '')
  const [availableClassrooms, setAvailableClassrooms] = useState<ClassroomOption[]>([])
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false)
  const frecuenciaReal = frecuenciaDias === 0 ? diasCustom : frecuenciaDias

  const {
    register,
    watch,
    setValue,
    getValues,
    trigger,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WizardFormValues, any, WizardValues>({
    resolver: zodResolver(CreateStudentSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      fecha_nacimiento: null,
      telefono: null,
      email: null,
      dni: null,
      direccion: null,
      apoderado_nombre: null,
      apoderado_telefono: null,
      apoderado_email: null,
      observaciones: null,
      cycle_id: '',
      classroom_id: '',
      selectedPlan: {
        num_cuotas: 6,
        monto_por_cuota: 120,
        frecuencia_dias: 30,
        fecha_primera_cuota: new Date().toISOString().split('T')[0] ?? '',
      },
      primerPago: {
        monto: 120,
        metodo: 'efectivo',
        referencia: '',
      },
    },
  })

  const selectedCycleId = watch('cycle_id')
  const selectedClassroomId = watch('classroom_id')
  const primerPagoMonto = watch('primerPago.monto')
  const selectedCycle = useMemo(
    () => cycles.find((cycle) => cycle.id === selectedCycleId) ?? null,
    [cycles, selectedCycleId]
  )
  const selectedClassroom = useMemo(
    () => availableClassrooms.find((classroom) => classroom.id === selectedClassroomId) ?? classrooms.find((classroom) => classroom.id === selectedClassroomId) ?? null,
    [availableClassrooms, classrooms, selectedClassroomId]
  )
  const totalPlan = numCuotas * montoPorCuota
  const ultimaFecha = useMemo(() => {
    const baseDate = new Date(fechaPrimera)
    if (Number.isNaN(baseDate.getTime())) return '—'
    baseDate.setDate(baseDate.getDate() + Math.max(numCuotas - 1, 0) * frecuenciaReal)
    return baseDate.toLocaleDateString('es-PE')
  }, [fechaPrimera, frecuenciaReal, numCuotas])

  useEffect(() => {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)

    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as { step?: number; values?: Partial<WizardValues> }
      if (parsed.values) {
        const savedPlan = parsed.values.selectedPlan
        if (savedPlan) {
          if (typeof savedPlan.num_cuotas === 'number') setNumCuotas(savedPlan.num_cuotas)
          if (typeof savedPlan.monto_por_cuota === 'number') setMontoPorCuota(savedPlan.monto_por_cuota)
          if (typeof savedPlan.frecuencia_dias === 'number') {
            const presetFrequencies = [1, 3, 7, 14, 30, 60, 90]
            if (presetFrequencies.includes(savedPlan.frecuencia_dias)) {
              setFrecuenciaDias(savedPlan.frecuencia_dias)
            } else {
              setFrecuenciaDias(0)
              setDiasCustom(savedPlan.frecuencia_dias)
            }
          }
          if (typeof savedPlan.fecha_primera_cuota === 'string' && savedPlan.fecha_primera_cuota) {
            setFechaPrimera(savedPlan.fecha_primera_cuota)
          }
        }
        reset({
          ...getValues(),
          ...parsed.values,
        })
      }

      if (parsed.step && parsed.step >= 1 && parsed.step <= 5) {
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
    if (!selectedCycleId) {
      setAvailableClassrooms([])
      setIsLoadingClassrooms(false)
      return
    }

    let isCancelled = false
    const supabase = createClient()

    async function fetchClassrooms() {
      setIsLoadingClassrooms(true)

      const { data, error } = await supabase
        .from('classrooms')
        .select('id, name, cycle_id, tipo, nivel')
        .eq('cycle_id', selectedCycleId)
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (isCancelled) return

      if (error) {
        setAvailableClassrooms([])
        toast.error('No se pudieron cargar los salones', {
          description: error.message,
        })
        setIsLoadingClassrooms(false)
        return
      }

      setAvailableClassrooms(((data ?? []) as any[]).map((classroom) => ({
        id: classroom.id as string,
        name: (classroom.name as string) ?? 'Sin nombre',
        cycle_id: classroom.cycle_id as string,
        tipo: (classroom.tipo as string | null) ?? null,
        nivel: (classroom.nivel as string | null) ?? null,
      })))
      setIsLoadingClassrooms(false)
    }

    void fetchClassrooms()

    return () => {
      isCancelled = true
    }
  }, [selectedCycleId])

  useEffect(() => {
    const selectedClassroomId = getValues('classroom_id')
    if (selectedClassroomId && !availableClassrooms.some((classroom) => classroom.id === selectedClassroomId)) {
      setValue('classroom_id', '')
    }
  }, [availableClassrooms, getValues, setValue])

  useEffect(() => {
    setValue('selectedPlan.num_cuotas', numCuotas, { shouldValidate: currentStep === 4 })
    setValue('selectedPlan.monto_por_cuota', montoPorCuota, { shouldValidate: currentStep === 4 })
    setValue('selectedPlan.frecuencia_dias', frecuenciaReal, { shouldValidate: currentStep === 4 })
    setValue('selectedPlan.fecha_primera_cuota', fechaPrimera, { shouldValidate: currentStep === 4 })
  }, [currentStep, fechaPrimera, frecuenciaReal, montoPorCuota, numCuotas, setValue])

  useEffect(() => {
    const currentAmount = getValues('primerPago.monto')
    if (!Number.isFinite(currentAmount) || currentAmount <= 0) {
      setValue('primerPago.monto', montoPorCuota)
    }
  }, [getValues, montoPorCuota, setValue])

  async function handleNext() {
    const fields = STEPS[currentStep - 1].fields as unknown as Parameters<typeof trigger>[0]
    const isValid = await trigger(fields)

    if (!isValid) return
    setCurrentStep((step) => Math.min(step + 1, 5))
  }

  function handlePrev() {
    setCurrentStep((step) => Math.max(step - 1, 1))
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      try {
        const result = await createStudentWithPayment({
          ...values,
          cycle_id: selectedCycle?.id ?? values.cycle_id,
        })

        window.sessionStorage.removeItem(STORAGE_KEY)

        toast.success('Alumno registrado y pago confirmado', {
          description: 'La matrícula y el primer pago fueron registrados correctamente.',
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
            Completa los 5 pasos para registrar al estudiante, asignarlo a un ciclo, vincular su plan y confirmar el primer pago.
          </p>
        </div>
      </div>

      <Stepper currentStep={currentStep} />

      <form onSubmit={onSubmit} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <fieldset disabled={isLoading} className="contents">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-5">
              <h3 className="mb-4 text-base font-semibold text-gray-900">Datos del alumno</h3>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="nombres" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nombres
                  </label>
                  <input
                    id="nombres"
                    type="text"
                    className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    {...register('nombres')}
                  />
                  {errors.nombres && <p className="mt-1 text-xs text-red-600">{errors.nombres.message}</p>}
                </div>

                <div>
                  <label htmlFor="apellidos" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Apellidos
                  </label>
                  <input
                    id="apellidos"
                    type="text"
                    className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    {...register('apellidos')}
                  />
                  {errors.apellidos && <p className="mt-1 text-xs text-red-600">{errors.apellidos.message}</p>}
                </div>

                <div>
                  <label htmlFor="dni" className="mb-1.5 block text-sm font-medium text-gray-700">
                    DNI
                  </label>
                  <input
                    id="dni"
                    type="text"
                    placeholder="Opcional"
                    className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    {...register('dni', { setValueAs: (value) => value?.trim() ? value.trim() : null })}
                  />
                  {errors.dni && <p className="mt-1 text-xs text-red-600">{errors.dni.message}</p>}
                </div>

                <div>
                  <label htmlFor="fecha_nacimiento" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Fecha de nacimiento
                  </label>
                  <input
                    id="fecha_nacimiento"
                    type="date"
                    className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    {...register('fecha_nacimiento', { setValueAs: (value) => value || null })}
                  />
                  {errors.fecha_nacimiento && <p className="mt-1 text-xs text-red-600">{errors.fecha_nacimiento.message}</p>}
                </div>

                <div>
                  <label htmlFor="telefono" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    id="telefono"
                    type="text"
                    placeholder="Opcional"
                    className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    {...register('telefono', { setValueAs: (value) => value?.trim() ? value.trim() : null })}
                  />
                  {errors.telefono && <p className="mt-1 text-xs text-red-600">{errors.telefono.message}</p>}
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

                <div className="md:col-span-2">
                  <label htmlFor="direccion" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <input
                    id="direccion"
                    type="text"
                    placeholder="Opcional"
                    className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    {...register('direccion', { setValueAs: (value) => value?.trim() ? value.trim() : null })}
                  />
                  {errors.direccion && <p className="mt-1 text-xs text-red-600">{errors.direccion.message}</p>}
                </div>
              </div>
            </div>

            <div className="border-b border-gray-100 pb-5">
              <h3 className="mb-4 text-base font-semibold text-gray-900">Datos del apoderado</h3>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="apoderado_nombre" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <input
                    id="apoderado_nombre"
                    type="text"
                    placeholder="Opcional"
                    className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    {...register('apoderado_nombre', { setValueAs: (value) => value?.trim() ? value.trim() : null })}
                  />
                  {errors.apoderado_nombre && <p className="mt-1 text-xs text-red-600">{errors.apoderado_nombre.message}</p>}
                </div>

                <div>
                  <label htmlFor="apoderado_telefono" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    id="apoderado_telefono"
                    type="text"
                    placeholder="Opcional"
                    className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    {...register('apoderado_telefono', { setValueAs: (value) => value?.trim() ? value.trim() : null })}
                  />
                  {errors.apoderado_telefono && <p className="mt-1 text-xs text-red-600">{errors.apoderado_telefono.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="apoderado_email" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <input
                    id="apoderado_email"
                    type="email"
                    placeholder="Opcional"
                    className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    {...register('apoderado_email', { setValueAs: (value) => value?.trim() ? value.trim() : null })}
                  />
                  {errors.apoderado_email && <p className="mt-1 text-xs text-red-600">{errors.apoderado_email.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-base font-semibold text-gray-900">Observaciones</h3>
              <textarea
                rows={3}
                placeholder="Alergias, condiciones médicas, notas..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                {...register('observaciones', { setValueAs: (value) => value?.trim() ? value.trim() : null })}
              />
              {errors.observaciones && <p className="mt-1 text-xs text-red-600">{errors.observaciones.message}</p>}
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
              disabled={!selectedCycleId || isLoadingClassrooms}
            >
              <option value="">{selectedCycleId ? 'Selecciona un salón' : 'Primero selecciona un ciclo'}</option>
              {isLoadingClassrooms && <option disabled>Cargando salones...</option>}
              {!isLoadingClassrooms && selectedCycleId && availableClassrooms.length === 0 && (
                <option disabled>No hay salones en este ciclo</option>
              )}
              {availableClassrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} {classroom.tipo ? `· ${classroom.tipo}` : ''} {classroom.nivel ? `· ${classroom.nivel}` : ''}
                </option>
              ))}
            </select>
            {errors.classroom_id && <p className="mt-1 text-xs text-red-600">{errors.classroom_id.message}</p>}
            {!isLoadingClassrooms && selectedCycleId && availableClassrooms.length === 0 && (
              <p className="mt-3 text-sm text-gray-500">
                No hay salones para este ciclo.{' '}
                <Link href="/salones" className="font-medium text-blue-600 hover:underline">
                  Crear salón
                </Link>
              </p>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="num_cuotas" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Número de cuotas
                  </label>
                  <input
                    id="num_cuotas"
                    type="number"
                    min="1"
                    max="36"
                    value={numCuotas}
                    onChange={(event) => setNumCuotas(Number(event.target.value))}
                    className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.selectedPlan?.num_cuotas && <p className="mt-1 text-xs text-red-600">{errors.selectedPlan.num_cuotas.message}</p>}
                </div>

                <div>
                  <label htmlFor="monto_por_cuota" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Monto por cuota
                  </label>
                  <input
                    id="monto_por_cuota"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={montoPorCuota}
                    onChange={(event) => setMontoPorCuota(Number(event.target.value))}
                    className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.selectedPlan?.monto_por_cuota && <p className="mt-1 text-xs text-red-600">{errors.selectedPlan.monto_por_cuota.message}</p>}
                </div>

                <div>
                  <label htmlFor="frecuencia_dias" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Frecuencia
                  </label>
                  <select
                    id="frecuencia_dias"
                    value={frecuenciaDias}
                    onChange={(event) => setFrecuenciaDias(Number(event.target.value))}
                    className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Diario (1 día)</option>
                    <option value={3}>Cada 3 días</option>
                    <option value={7}>Semanal (7 días)</option>
                    <option value={14}>Quincenal (14 días)</option>
                    <option value={30}>Mensual (30 días)</option>
                    <option value={60}>Bimestral (60 días)</option>
                    <option value={90}>Trimestral (90 días)</option>
                    <option value={0}>Personalizado</option>
                  </select>
                  {errors.selectedPlan?.frecuencia_dias && <p className="mt-1 text-xs text-red-600">{errors.selectedPlan.frecuencia_dias.message}</p>}
                </div>

                <div>
                  <label htmlFor="fecha_primera_cuota" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Fecha primera cuota
                  </label>
                  <input
                    id="fecha_primera_cuota"
                    type="date"
                    value={fechaPrimera}
                    onChange={(event) => setFechaPrimera(event.target.value)}
                    className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.selectedPlan?.fecha_primera_cuota && <p className="mt-1 text-xs text-red-600">{errors.selectedPlan.fecha_primera_cuota.message}</p>}
                </div>
              </div>

              {frecuenciaDias === 0 && (
                <div className="mt-5">
                  <label htmlFor="dias_custom" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Días entre cuotas
                  </label>
                  <input
                    id="dias_custom"
                    type="number"
                    min="1"
                    max="365"
                    value={diasCustom}
                    onChange={(event) => setDiasCustom(Number(event.target.value))}
                    placeholder="Días entre cuotas"
                    className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Preview en tiempo real</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total del plan</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(Number.isFinite(totalPlan) ? totalPlan : null)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Primera cuota</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {fechaPrimera || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Última cuota</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {ultimaFecha}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Frecuencia</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    Cada {frecuenciaReal} día(s)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Resumen</p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {[watch('nombres'), watch('apellidos')].filter(Boolean).join(' ') || 'Alumno sin nombre'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedCycle?.name ?? 'Sin ciclo'} | {selectedClassroom?.name ?? 'Sin salón'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {numCuotas} cuotas de {formatCurrency(Number.isFinite(montoPorCuota) ? montoPorCuota : null)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(Number.isFinite(totalPlan) ? totalPlan : null)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cronograma</p>
                  <p className="mt-1 text-sm text-gray-700">
                    Primera cuota: {fechaPrimera || '—'} · Última cuota: {ultimaFecha} · Cada {frecuenciaReal} día(s)
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
              <p className="mb-4 text-base font-semibold text-gray-900">Primer pago</p>

              <div>
                <label htmlFor="primerPago.monto" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Monto a pagar
                </label>
                <input
                  id="primerPago.monto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  {...register('primerPago.monto', { valueAsNumber: true })}
                />
                {errors.primerPago?.monto && <p className="mt-1 text-xs text-red-600">{errors.primerPago.monto.message}</p>}
              </div>

              <div className="mt-5">
                <label htmlFor="primerPago.metodo" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Método
                </label>
                <select
                  id="primerPago.metodo"
                  className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  {...register('primerPago.metodo')}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="yape">Yape</option>
                  <option value="plin">Plin</option>
                  <option value="transferencia">Transferencia</option>
                </select>
                {errors.primerPago?.metodo && <p className="mt-1 text-xs text-red-600">{errors.primerPago.metodo.message}</p>}
              </div>

              <div className="mt-5">
                <label htmlFor="primerPago.referencia" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Referencia
                </label>
                <input
                  id="primerPago.referencia"
                  type="text"
                  placeholder="Ej: YPE-1234567890"
                  className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  {...register('primerPago.referencia')}
                />
                {errors.primerPago?.referencia && <p className="mt-1 text-xs text-red-600">{errors.primerPago.referencia.message}</p>}
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Monto sugerido: {formatCurrency(Number.isFinite(montoPorCuota) ? montoPorCuota : null)}. Monto actual: {formatCurrency(Number.isFinite(primerPagoMonto) ? primerPagoMonto : null)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1 || isLoading}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isLoading ? 'Guardando...' : 'Crear matrícula + Pago'}
            </button>
          )}
        </div>
        </fieldset>
      </form>
    </div>
  )
}
