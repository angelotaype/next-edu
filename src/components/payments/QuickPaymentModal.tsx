'use client'

import { useEffect, useState, useTransition } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import PaymentMethodSelect from './PaymentMethodSelect'
import PaymentReceipt, { type PaymentReceiptData } from './PaymentReceipt'
import { createQuickPayment } from './actions'

const quickPaymentSchema = z.object({
  monto: z.number().min(0.01, 'Ingresa un monto mayor a 0.').max(99999.99, 'Monto fuera de rango.'),
  metodo: z.enum(['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta']),
  referencia: z.string().trim().max(50, 'Máximo 50 caracteres.').optional(),
})

type QuickPaymentValues = z.infer<typeof quickPaymentSchema>

interface QuickPaymentStudent {
  id: string
  fullName: string
  debtAmount: number
  overdueAmount?: number
  pendingInstallments?: number
  nextInstallmentAmount?: number
  paymentStatus?: string
}

export default function QuickPaymentModal({
  open,
  onOpenChange,
  student,
  onPaid,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: QuickPaymentStudent | null
  onPaid?: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const isLoading = isPending
  const [receipt, setReceipt] = useState<PaymentReceiptData | null>(null)
  const defaultAmount = student ? Math.max(student.overdueAmount ?? student.debtAmount, 0.01) : 0.01

  const {
    register,
    reset,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickPaymentValues>({
    resolver: zodResolver(quickPaymentSchema),
    defaultValues: {
      monto: defaultAmount,
      metodo: 'efectivo',
      referencia: '',
    },
  })
  const selectedMethod = watch('metodo') ?? 'efectivo'
  const enteredAmount = watch('monto') ?? defaultAmount
  const currentDebtAmount = student?.debtAmount ?? 0
  const overpaymentAmount = enteredAmount > currentDebtAmount ? enteredAmount - currentDebtAmount : 0

  useEffect(() => {
    if (!open || !student) return

    reset({
      monto: defaultAmount,
      metodo: 'efectivo',
      referencia: '',
    })
    setReceipt(null)
  }, [defaultAmount, open, reset, student])

  useEffect(() => {
    if (!receipt) return

    const timeout = window.setTimeout(() => {
      setReceipt(null)
      onOpenChange(false)
      onPaid?.()
    }, 3000)

    return () => window.clearTimeout(timeout)
  }, [onOpenChange, onPaid, receipt])

  const onSubmit = handleSubmit((values) => {
    if (!student) return
    if (!values.metodo || !['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'].includes(values.metodo)) {
      toast.error('Selecciona un método de pago válido')
      return
    }

    startTransition(async () => {
      try {
        const result = await createQuickPayment({
          studentId: student.id,
          amount: values.monto,
          method: values.metodo,
          reference: values.referencia?.trim() ? values.referencia.trim() : null,
        })

        setReceipt(result)
        toast.success('Pago registrado', {
          description: `Comprobante ${result.receiptNumber}`,
        })
      } catch (error) {
        toast.error('No se pudo registrar el pago', {
          description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        })
      }
    })
  })

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] border border-gray-200 bg-white p-5 shadow-2xl md:p-6">
          {receipt ? (
            <PaymentReceipt receipt={receipt} />
          ) : (
            <>
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Pago rápido</p>
                <Dialog.Title className="mt-2 text-xl font-bold text-gray-900">{student?.fullName ?? 'Alumno'}</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-relaxed text-gray-500">
                  Registra un abono rápido y aplícalo automáticamente a las cuotas pendientes.
                </Dialog.Description>
              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Deuda vencida</p>
                <p className="mt-1 text-lg font-bold text-red-700">
                  {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(student?.overdueAmount ?? student?.debtAmount ?? 0)}
                </p>
              </div>
              {student && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {student.debtAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setValue('monto', student.debtAmount, { shouldDirty: true, shouldValidate: true })}
                      className="rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                    >
                      Pagar todo: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(student.debtAmount)}
                    </button>
                  )}
                  {(student.nextInstallmentAmount ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setValue('monto', student.nextInstallmentAmount ?? 0, { shouldDirty: true, shouldValidate: true })}
                      className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      Próxima cuota: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(student.nextInstallmentAmount ?? 0)}
                    </button>
                  )}
                </div>
              )}
            </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <fieldset disabled={isLoading} className="space-y-4">
                <div>
                  <label htmlFor="monto" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Monto a pagar
                  </label>
                  <input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="min-h-12 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    {...register('monto', { valueAsNumber: true })}
                  />
                  {errors.monto && <p className="mt-1 text-xs text-red-600">{errors.monto.message}</p>}
                </div>

                {student && student.debtAmount > 0 && overpaymentAmount > 0 && (
                  <div className="rounded-xl border border-green-500 bg-green-100 px-4 py-3">
                    <p className="text-sm text-green-700">
                      Sobrepago detectado: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(overpaymentAmount)} quedará como crédito.
                    </p>
                  </div>
                )}

                {student && student.debtAmount === 0 && enteredAmount > 0 && (
                  <div className="rounded-xl border border-blue-500 bg-blue-100 px-4 py-3">
                    <p className="text-sm text-blue-700">
                      Se registrará como crédito anticipado: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(enteredAmount)}.
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="metodo" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Método
                  </label>
                  <PaymentMethodSelect
                    id="metodo"
                    value={selectedMethod}
                    {...register('metodo')}
                    onChange={(event) => {
                      setValue('metodo', event.target.value as QuickPaymentValues['metodo'], {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }}
                  />
                  {errors.metodo && <p className="mt-1 text-xs text-red-600">{errors.metodo.message}</p>}
                </div>

                <div>
                  <label htmlFor="referencia" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Referencia
                  </label>
                  <input
                    id="referencia"
                    type="text"
                    placeholder="Opcional"
                    className="min-h-12 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    {...register('referencia')}
                  />
                  {errors.referencia && <p className="mt-1 text-xs text-red-600">{errors.referencia.message}</p>}
                </div>

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      disabled={isLoading}
                      className="min-h-11 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={isLoading || !student}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                  >
                    {isLoading && (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {isLoading ? 'Registrando...' : `Registrar pago: ${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(enteredAmount)}`}
                  </button>
                </div>
                </fieldset>
              </form>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
