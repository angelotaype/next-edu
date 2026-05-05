import { z } from 'zod'

const nullableTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}, z.string().trim().max(255).nullable())

const nullableDateString = z.preprocess((value) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}, z.string().refine((value) => !value || !Number.isNaN(Date.parse(value)), 'Fecha inválida.').nullable())

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
  nombres: z.string().trim().min(2, 'Ingresa el nombre.').max(80, 'Máximo 80 caracteres.'),
  apellidos: z.string().trim().min(2, 'Ingresa los apellidos.').max(80, 'Máximo 80 caracteres.'),
  fecha_nacimiento: nullableDateString,
  telefono: nullableTrimmedString.pipe(z.string().trim().max(20, 'Máximo 20 caracteres.').nullable()),
  email: z.preprocess((value) => {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }, z.string().trim().email('Correo inválido.').nullable()),
  dni: nullableTrimmedString.pipe(z.string().trim().min(8, 'DNI debe tener al menos 8 dígitos.').max(12, 'Máximo 12 caracteres.').nullable()),
  direccion: nullableTrimmedString.pipe(z.string().trim().max(200, 'Máximo 200 caracteres.').nullable()),
  apoderado_nombre: nullableTrimmedString.pipe(z.string().trim().min(3, 'Ingresa al menos 3 caracteres.').max(120, 'Máximo 120 caracteres.').nullable()),
  apoderado_telefono: nullableTrimmedString.pipe(z.string().trim().max(20, 'Máximo 20 caracteres.').nullable()),
  apoderado_email: z.preprocess((value) => {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }, z.string().trim().email('Correo inválido.').nullable()),
  observaciones: nullableTrimmedString.pipe(z.string().trim().max(500, 'Máximo 500 caracteres.').nullable()),
  cycle_id: z.string().uuid('Selecciona un ciclo válido.'),
  classroom_id: z.string().uuid('Selecciona un salón válido.'),
  selectedPlan: z.object({
    num_cuotas: z.number().int().min(1, 'Mínimo 1 cuota').max(36, 'Máximo 36 cuotas'),
    monto_por_cuota: z.number().min(0.01, 'Monto inválido'),
    frecuencia_dias: z.number().int().min(1).max(365),
    fecha_primera_cuota: z.string().min(1),
  }),
  primerPago: CreatePaymentSchema.omit({ metodo: true }).extend({
    metodo: z.enum(['efectivo', 'yape', 'plin', 'transferencia']),
  }),
})

export const LoginSchema = z.object({
  email: z.string().trim().email('Correo inválido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
})

export const StudentProfileSchema = CreateStudentSchema.pick({
  nombres: true,
  apellidos: true,
  dni: true,
  fecha_nacimiento: true,
  telefono: true,
  email: true,
  direccion: true,
  apoderado_nombre: true,
  apoderado_telefono: true,
  apoderado_email: true,
  observaciones: true,
})

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type StudentProfileInput = z.infer<typeof StudentProfileSchema>
