export type CicloEstado = 'activo' | 'inactivo'

export interface CycleRow {
  id: string
  school_id: string
  name: string
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string | null
}
