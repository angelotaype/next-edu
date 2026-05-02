export interface CycleOption {
  id: string
  name: string
}

export interface ClassroomRow {
  id: string
  school_id: string
  name: string
  grado: number
  seccion: string
  cycle_id: string
  capacity: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string | null
  cycle_name: string | null
}
