CREATE TABLE IF NOT EXISTS public.attendance_qr_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  qr_token text NOT NULL,
  action text NOT NULL,
  notes text,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_qr_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_qr_tenant_isolation ON public.attendance_qr_log;
CREATE POLICY attendance_qr_tenant_isolation ON public.attendance_qr_log
  FOR ALL TO authenticated
  USING (school_id = public.fn_current_school_id())
  WITH CHECK (school_id = public.fn_current_school_id());

CREATE INDEX IF NOT EXISTS idx_attendance_qr_token ON public.attendance_qr_log(qr_token);
CREATE INDEX IF NOT EXISTS idx_attendance_qr_student_id ON public.attendance_qr_log(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_qr_scanned_at ON public.attendance_qr_log(scanned_at DESC);

CREATE OR REPLACE VIEW public.student_qr_status AS
SELECT
  s.id,
  s.school_id,
  s.qr_token,
  s.code,
  s.nombres,
  s.apellidos,
  s.photo_url,
  COALESCE(s.telefono, s.phone) AS telefono,
  s.email,
  s.estado,
  s.estado_matricula,
  pp.id AS payment_plan_id,
  COALESCE(SUM(
    CASE
      WHEN i.status <> 'pagado' THEN GREATEST(COALESCE(i.amount_due, 0) - COALESCE(i.amount_paid, 0), 0)
      ELSE 0
    END
  ), 0)::numeric(10,2) AS total_debt,
  COALESCE(SUM(
    CASE
      WHEN i.status <> 'pagado' AND i.due_date IS NOT NULL AND i.due_date < CURRENT_DATE
        THEN GREATEST(COALESCE(i.amount_due, 0) - COALESCE(i.amount_paid, 0), 0)
      ELSE 0
    END
  ), 0)::numeric(10,2) AS overdue_debt,
  MIN(CASE WHEN i.status <> 'pagado' THEN i.due_date END) AS next_due_date,
  MIN(CASE WHEN i.status <> 'pagado' THEN i.amount_due END)::numeric(10,2) AS next_installment_amount,
  COUNT(CASE WHEN i.status <> 'pagado' THEN 1 END)::integer AS pending_installments,
  CASE
    WHEN COUNT(CASE WHEN i.status <> 'pagado' THEN 1 END) = 0 THEN 'Al día'
    WHEN COALESCE(SUM(
      CASE
        WHEN i.status <> 'pagado' AND i.due_date IS NOT NULL AND i.due_date < CURRENT_DATE
          THEN GREATEST(COALESCE(i.amount_due, 0) - COALESCE(i.amount_paid, 0), 0)
        ELSE 0
      END
    ), 0) > 0 THEN 'En riesgo'
    ELSE 'Debe pagar'
  END AS payment_status,
  MAX(aql.scanned_at) AS last_scanned_at
FROM public.students s
LEFT JOIN public.payment_plans pp
  ON pp.student_id = s.id
  AND pp.deleted_at IS NULL
LEFT JOIN public.installments i
  ON i.payment_plan_id = pp.id
  AND i.deleted_at IS NULL
LEFT JOIN public.attendance_qr_log aql
  ON aql.student_id = s.id
WHERE s.deleted_at IS NULL
GROUP BY
  s.id,
  s.school_id,
  s.qr_token,
  s.code,
  s.nombres,
  s.apellidos,
  s.photo_url,
  COALESCE(s.telefono, s.phone),
  s.email,
  s.estado,
  s.estado_matricula,
  pp.id;

GRANT SELECT ON public.student_qr_status TO authenticated;
