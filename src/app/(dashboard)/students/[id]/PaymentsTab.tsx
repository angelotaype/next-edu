'use client'

import Link from 'next/link'
import { format } from 'date-fns'

export interface InstallmentRow {
  id: string
  paymentPlanId: string | null
  installmentNumber: number | null
  amountDue: number | null
  amountPaid: number | null
  dueDate: string | null
  status: string | null
}

export interface PaymentPlanRow {
  id: string
  name: string | null
  totalAmount: number | null
  status: string | null
}

function formatCurrency(value: number | null) {
  if (value == null || Number.isNaN(value)) return '—'

  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return '—'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'

  return format(parsed, 'dd/MM/yyyy')
}

function statusClass(status: string | null) {
  switch (status) {
    case 'paid':
    case 'pagado':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case 'pending':
    case 'pendiente':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    case 'overdue':
    case 'vencido':
      return 'bg-red-50 text-red-700 ring-1 ring-red-200'
    default:
      return 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
  }
}

export default function PaymentsTab({
  studentId,
  plans,
  installments,
  planTotal,
}: {
  studentId: string
  plans: PaymentPlanRow[]
  installments: InstallmentRow[]
  planTotal: number
}) {
  if (installments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
        <p className="text-sm font-medium text-gray-900">No hay cuotas registradas aún.</p>
        <p className="mt-1 text-sm text-gray-500">Cuando el alumno tenga un plan generado, aparecerá aquí.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {plans.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Plan</p>
              <p className="mt-2 text-base font-semibold text-gray-900">{plan.name ?? 'Plan sin nombre'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>Total: {formatCurrency(plan.totalAmount)}</span>
                <span className={['rounded-full px-2.5 py-1 text-xs font-medium capitalize', statusClass(plan.status)].join(' ')}>
                  {plan.status ?? '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Total del plan</p>
          <p className="mt-2 text-xl font-bold text-gray-900">{formatCurrency(planTotal)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Cuotas</p>
          <p className="mt-2 text-xl font-bold text-gray-900">{installments.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Pendiente</p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {formatCurrency(
              installments.reduce((sum, installment) => sum + Math.max((installment.amountDue ?? 0) - (installment.amountPaid ?? 0), 0), 0)
            )}
          </p>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {installments.map((installment) => (
          <div key={installment.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Cuota {installment.installmentNumber ?? '—'}
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(installment.amountDue)}</p>
              </div>
              <span className={['rounded-full px-2.5 py-1 text-xs font-medium capitalize', statusClass(installment.status)].join(' ')}>
                {installment.status ?? '—'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Vence</p>
                <p className="font-medium text-gray-700">{formatDate(installment.dueDate)}</p>
              </div>
              <div>
                <p className="text-gray-400">Pagado</p>
                <p className="font-medium text-gray-700">{formatCurrency(installment.amountPaid)}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href={`/students/${studentId}`}
                className="inline-flex min-h-11 items-center rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                Ver detalle
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Cuota</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Monto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Pagado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Vencimiento</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {installments.map((installment) => (
              <tr key={installment.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-4 text-sm font-semibold text-gray-900">{installment.installmentNumber ?? '—'}</td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-900">{formatCurrency(installment.amountDue)}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{formatCurrency(installment.amountPaid)}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{formatDate(installment.dueDate)}</td>
                <td className="px-4 py-4">
                  <span className={['rounded-full px-2.5 py-1 text-xs font-medium capitalize', statusClass(installment.status)].join(' ')}>
                    {installment.status ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/students/${studentId}`}
                    className="inline-flex min-h-11 items-center rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
