'use client'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value)
}

export interface PaymentReceiptData {
  receiptNumber: string
  amount: number
  paidAt: string
  method: string
  studentName: string
}

export default function PaymentReceipt({
  receipt,
}: {
  receipt: PaymentReceiptData
}) {
  return (
    <div className="rounded-3xl border border-green-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Pago registrado</p>
          <p className="text-sm text-gray-500">Comprobante generado correctamente.</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-gray-400">Alumno</p>
          <p className="mt-1 font-semibold text-gray-900">{receipt.studentName}</p>
        </div>
        <div>
          <p className="text-gray-400">Comprobante</p>
          <p className="mt-1 font-mono font-semibold text-gray-900">{receipt.receiptNumber}</p>
        </div>
        <div>
          <p className="text-gray-400">Monto</p>
          <p className="mt-1 font-semibold text-gray-900">{formatCurrency(receipt.amount)}</p>
        </div>
        <div>
          <p className="text-gray-400">Método</p>
          <p className="mt-1 font-semibold capitalize text-gray-900">{receipt.method}</p>
        </div>
      </div>
    </div>
  )
}
