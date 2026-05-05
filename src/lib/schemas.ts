import { z } from 'zod'

const nullableTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}, z.string().trim().max(255).nullable())

export const CreatePaymentSchema = z.object({
  monto: z.number().min(0.01, 'Ingresa un monto mayor a 0.').max(99999.99, 'Monto fuera de rango.'),
  metodo: z.enum(['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta']),
  referencia: z.preprocess((value) => {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }, z.string().trim().max(50, 'Máximo 50 caracteres.').nullable()).optional(),
})

export const CreateStudentSchema = z.object({
  name: z.string().trim().min(3, 'Ingresa al menos 3 caracteres.').max(120, 'Máximo 120 caracteres.'),
  email: z.preprocess((value) => {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }, z.string().trim().email('Correo inválido.').nullable()),
  phone: nullableTrimmedString.pipe(z.string().trim().max(30, 'Máximo 30 caracteres.').nullable()),
  dni: nullableTrimmedString.pipe(z.string().trim().max(30, 'Máximo 30 caracteres.').nullable()),
  cycle_id: z.string().uuid('Selecciona un ciclo válido.'),
  classroom_id: z.string().uuid('Selecciona un salón válido.'),
  selectedPlan: z.object({
    templateId: z.string().min(1, 'Selecciona un tipo de plan.'),
    installments: z.number().int().min(1, 'Plan inválido.'),
    monthlyAmount: z.number().min(0.01, 'Plan inválido.'),
    totalAmount: z.number().min(0.01, 'Plan inválido.'),
  }),
  payment_frequency: z.enum(['monthly', 'quarterly', 'yearly']),
  primerPago: CreatePaymentSchema.omit({ metodo: true }).extend({
    metodo: z.enum(['efectivo', 'yape', 'plin', 'transferencia']),
  }),
})

export const LoginSchema = z.object({
  email: z.string().trim().email('Correo inválido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
})

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>
export type LoginInput = z.infer<typeof LoginSchema>
