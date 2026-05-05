'use client'

import { useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { StudentProfileSchema, type StudentProfileInput } from '@/lib/schemas'
import { updateStudent } from './actions'

interface EditStudentFormProps {
  studentId: string
  initialValues: StudentProfileInput
}

type StudentProfileFormValues = z.input<typeof StudentProfileSchema>

export default function EditStudentForm({ studentId, initialValues }: EditStudentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentProfileFormValues, any, StudentProfileInput>({
    resolver: zodResolver(StudentProfileSchema),
    defaultValues: initialValues,
  })

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      try {
        await updateStudent(studentId, values)
        toast.success('Información actualizada', {
          description: 'Los cambios del estudiante fueron guardados correctamente.',
        })
        router.push(`/students/${studentId}`)
        router.refresh()
      } catch (error) {
        toast.error('No se pudieron guardar los cambios', {
          description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        })
      }
    })
  })

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <fieldset disabled={isPending} className="space-y-6">
        <div className="border-b border-gray-100 pb-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Datos del alumno</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="nombres" className="mb-1.5 block text-sm font-medium text-gray-700">Nombres</label>
              <input id="nombres" className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" {...register('nombres')} />
              {errors.nombres && <p className="mt-1 text-xs text-red-600">{errors.nombres.message}</p>}
            </div>
            <div>
              <label htmlFor="apellidos" className="mb-1.5 block text-sm font-medium text-gray-700">Apellidos</label>
              <input id="apellidos" className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" {...register('apellidos')} />
              {errors.apellidos && <p className="mt-1 text-xs text-red-600">{errors.apellidos.message}</p>}
            </div>
            <div>
              <label htmlFor="dni" className="mb-1.5 block text-sm font-medium text-gray-700">DNI</label>
              <input id="dni" className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" {...register('dni', { setValueAs: (value) => value?.trim() ? value.trim() : null })} />
              {errors.dni && <p className="mt-1 text-xs text-red-600">{errors.dni.message}</p>}
            </div>
            <div>
              <label htmlFor="fecha_nacimiento" className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de nacimiento</label>
              <input id="fecha_nacimiento" type="date" className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" {...register('fecha_nacimiento', { setValueAs: (value) => value || null })} />
              {errors.fecha_nacimiento && <p className="mt-1 text-xs text-red-600">{errors.fecha_nacimiento.message}</p>}
            </div>
            <div>
              <label htmlFor="telefono" className="mb-1.5 block text-sm font-medium text-gray-700">Teléfono</label>
              <input id="telefono" className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" {...register('telefono', { setValueAs: (value) => value?.trim() ? value.trim() : null })} />
              {errors.telefono && <p className="mt-1 text-xs text-red-600">{errors.telefono.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Correo electrónico</label>
              <input id="email" type="email" className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" {...register('email', { setValueAs: (value) => value?.trim() ? value.trim() : null })} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="direccion" className="mb-1.5 block text-sm font-medium text-gray-700">Dirección</label>
              <input id="direccion" className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" {...register('direccion', { setValueAs: (value) => value?.trim() ? value.trim() : null })} />
              {errors.direccion && <p className="mt-1 text-xs text-red-600">{errors.direccion.message}</p>}
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 pb-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Datos del apoderado</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="apoderado_nombre" className="mb-1.5 block text-sm font-medium text-gray-700">Nombre completo</label>
              <input id="apoderado_nombre" className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" {...register('apoderado_nombre', { setValueAs: (value) => value?.trim() ? value.trim() : null })} />
              {errors.apoderado_nombre && <p className="mt-1 text-xs text-red-600">{errors.apoderado_nombre.message}</p>}
            </div>
            <div>
              <label htmlFor="apoderado_telefono" className="mb-1.5 block text-sm font-medium text-gray-700">Teléfono</label>
              <input id="apoderado_telefono" className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" {...register('apoderado_telefono', { setValueAs: (value) => value?.trim() ? value.trim() : null })} />
              {errors.apoderado_telefono && <p className="mt-1 text-xs text-red-600">{errors.apoderado_telefono.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="apoderado_email" className="mb-1.5 block text-sm font-medium text-gray-700">Correo electrónico</label>
              <input id="apoderado_email" type="email" className="min-h-12 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" {...register('apoderado_email', { setValueAs: (value) => value?.trim() ? value.trim() : null })} />
              {errors.apoderado_email && <p className="mt-1 text-xs text-red-600">{errors.apoderado_email.message}</p>}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="observaciones" className="mb-1.5 block text-sm font-medium text-gray-700">Observaciones</label>
          <textarea id="observaciones" rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" {...register('observaciones', { setValueAs: (value) => value?.trim() ? value.trim() : null })} />
          {errors.observaciones && <p className="mt-1 text-xs text-red-600">{errors.observaciones.message}</p>}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-between">
          <Link href={`/students/${studentId}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
            Cancelar
          </Link>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
