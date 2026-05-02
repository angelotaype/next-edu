export type CicloEstado = 'activo' | 'inactivo'

export interface CycleRow {
  id: string
  school_id: string
  name: string
  ano: number
  fecha_inicio: string | null
  fecha_fin: string | null
  estado: CicloEstado
  created_at: string
  updated_at: string
}
