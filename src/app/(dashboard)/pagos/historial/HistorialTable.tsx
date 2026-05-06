'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { revertPaymentAction } from './actions'

type HistorialPaymentRow = {
  id: string
  amount: number
  method: string | null
  paid_at: string
  receipt_number: string | null
  reference: string | null
  student_nombre: string | null
  student_apellido: string | null
  student_code: string | null
}

export default function HistorialTable({ payments }: { payments: HistorialPaymentRow[] }) {
  const [reverting, setReverting] = useState<string | null>(null)

  const isRevertible = (paidAt: string) => {
    const paid = new Date(paidAt)
    const now = new Date()
    return now.getTime() - paid.getTime() < 24 * 60 * 60 * 1000
  }

  const handleRevert = async (paymentId: string) => {
    if (!window.confirm('¿Revertir este pago? Se deshará la aplicación del monto.')) {
      return
    }

    setReverting(paymentId)

    try {
      const result = await revertPaymentAction(paymentId)
      const amount = Number((result as { amount_reverted?: number | string } | null)?.amount_reverted) || 0
      toast.success(`Pago revertido: S/ ${amount.toFixed(2)}`)
      setTimeout(() => window.location.reload(), 700)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo revertir el pago.'
      toast.error(message)
    } finally {
      setReverting(null)
    }
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
        Aún no hay pagos registrados.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/80 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Alumno</th>
              <th className="px-4 py-3 text-left font-semibold">Código</th>
              <th className="px-4 py-3 text-right font-semibold">Monto</th>
              <th className="px-4 py-3 text-left font-semibold">Método</th>
              <th className="px-4 py-3 text-left font-semibold">Fecha/Hora</th>
              <th className="px-4 py-3 text-left font-semibold">Comprobante</th>
              <th className="px-4 py-3 text-left font-semibold">Referencia</th>
              <th className="px-4 py-3 text-center font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const fullName = `${payment.student_apellido ?? ''}, ${payment.student_nombre ?? ''}`
                .trim()
                .replace(/^,\s*/, '') || 'Alumno sin nombre'

              return (
                <tr key={payment.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70">
                  <td className="px-4 py-3 text-gray-900">{fullName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{payment.student_code ?? '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">S/ {payment.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize text-gray-700">{payment.method ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(payment.paid_at).toLocaleString('es-PE')}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{payment.receipt_number ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{payment.reference || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {isRevertible(payment.paid_at) ? (
                      <button
                        type="button"
                        onClick={() => handleRevert(payment.id)}
                        disabled={reverting === payment.id}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {reverting === payment.id ? 'Revirtiendo...' : '↺ Revertir'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Fuera de plazo</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
