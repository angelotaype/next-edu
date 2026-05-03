'use client'

const METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
] as const

export default function PaymentMethodSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        'min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500',
        props.className ?? '',
      ].join(' ').trim()}
    >
      {METHODS.map((method) => (
        <option key={method.value} value={method.value}>
          {method.label}
        </option>
      ))}
    </select>
  )
}
