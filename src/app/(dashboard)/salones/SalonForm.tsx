'use client'

import { useEffect, useState, useTransition } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { createClassroom, updateClassroom, type ClassroomInput } from './actions'
import type { ClassroomRow, CycleOption } from './types'

const salonSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa al menos 2 caracteres.').max(100, 'Máximo 100 caracteres.'),
  cycle_id: z.string().uuid('Selecciona un ciclo válido.'),
  tipo: z.string().trim().min(2, 'Ingresa al menos 2 caracteres.').max(50, 'Máximo 50 caracteres.'),
  nivel: z.string().trim().min(2, 'Ingresa al menos 2 caracteres.').max(50, 'Máximo 50 caracteres.'),
})

type SalonFormValues = z.infer<typeof salonSchema>

interface SalonFormProps {
  cycles: CycleOption[]
  classroom?: ClassroomRow
  triggerLabel: string
  triggerVariant?: 'primary' | 'secondary'
}

function toDefaultValues(classroom?: ClassroomRow): SalonFormValues {
  return {
    name: classroom?.name ?? '',
    cycle_id: classroom?.cycle_id ?? '',
    tipo: classroom?.tipo ?? '',
    nivel: classroom?.nivel ?? '',
  }
}

function mapToActionInput(values: SalonFormValues): ClassroomInput {
  return values
}

export default function SalonForm({
  cycles,
  classroom,
  triggerLabel,
  triggerVariant = 'primary',
}: SalonFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = !!classroom

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalonFormValues>({
    resolver: zodResolver(salonSchema),
    defaultValues: toDefaultValues(classroom),
  })

  useEffect(() => {
    if (open) {
      reset(toDefaultValues(classroom))
    }
  }, [classroom, open, reset])

  function closeAndReset() {
    setOpen(false)
    reset(toDefaultValues(classroom))
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (isEdit && classroom) {
          await updateClassroom(classroom.id, mapToActionInput(values))
          toast.success('Salón actualizado', {
            description: `${values.name} fue actualizado correctamente.`,
          })
        } else {
          await createClassroom(mapToActionInput(values))
          toast.success('Salón creado', {
            description: `${values.name} fue registrado correctamente.`,
          })
        }

        closeAndReset()
      } catch (error) {
        toast.error('No se pudo guardar el salón', {
          description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        })
      }
    })
  })

  const triggerClassName = triggerVariant === 'primary'
    ? 'inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]'
    : 'inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98]'

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={triggerClassName}>
        {triggerLabel}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-gray-950/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl focus:outline-none sm:w-full sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold tracking-tight text-gray-900">
                {isEdit ? 'Editar salón' : 'Nuevo salón'}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-500">
                Define ciclo, tipo y nivel operativo del salón.
              </Dialog.Description>
            </div>

            <Dialog.Close className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Dialog.Close>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Nombre del salón
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Ej. Salón A"
                  className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  {...register('name')}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="cycle_id" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Ciclo asociado
                </label>
                <select
                  id="cycle_id"
                  className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  {...register('cycle_id')}
                >
                  <option value="">Selecciona un ciclo</option>
                  {cycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
                  ))}
                </select>
                {errors.cycle_id && <p className="mt-1 text-xs text-red-600">{errors.cycle_id.message}</p>}
              </div>

              <div>
                <label htmlFor="tipo" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Tipo
                </label>
                <input
                  id="tipo"
                  type="text"
                  placeholder="Ej. Escolar"
                  className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  {...register('tipo')}
                />
                {errors.tipo && <p className="mt-1 text-xs text-red-600">{errors.tipo.message}</p>}
              </div>

              <div>
                <label htmlFor="nivel" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Nivel
                </label>
                <input
                  id="nivel"
                  type="text"
                  placeholder="Ej. Primaria"
                  className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  {...register('nivel')}
                />
                {errors.nivel && <p className="mt-1 text-xs text-red-600">{errors.nivel.message}</p>}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
              <Dialog.Close className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98]">
                Cancelar
              </Dialog.Close>
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
                {isEdit ? 'Guardar cambios' : 'Crear salón'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
