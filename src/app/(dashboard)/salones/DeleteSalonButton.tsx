'use client'

import { useTransition } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { toast } from 'sonner'
import { deleteClassroom } from './actions'

interface DeleteSalonButtonProps {
  classroomId: string
  classroomName: string
}

export default function DeleteSalonButton({ classroomId, classroomName }: DeleteSalonButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteClassroom(classroomId)
        toast.success('Salón eliminado', {
          description: `${classroomName} fue desactivado correctamente.`,
        })
      } catch (error) {
        toast.error('No se pudo eliminar el salón', {
          description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        })
      }
    })
  }

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98]">
        Eliminar
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-gray-950/40 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl focus:outline-none sm:w-full sm:p-6">
          <AlertDialog.Title className="text-xl font-bold tracking-tight text-gray-900">
            Eliminar salón
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-gray-500">
            Se desactivará <span className="font-semibold text-gray-700">{classroomName}</span>. Podrás seguir viendo su historial, pero dejará de operar como activo.
          </AlertDialog.Description>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98]">
              Cancelar
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={handleDelete}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
            >
              {isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
