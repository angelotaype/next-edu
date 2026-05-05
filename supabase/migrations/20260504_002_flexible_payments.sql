ALTER TABLE public.installments
ALTER COLUMN due_date DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.fn_apply_payment_to_oldest_installments(
  p_payment_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_amount numeric(10,2);
  v_payment_plan_id uuid;
  v_school_id uuid;
  v_applied numeric(10,2) := 0;
  v_remaining numeric(10,2);
  v_student_id uuid;
  v_qr_token text;
  v_installment record;
  v_pending numeric(10,2);
  v_to_apply numeric(10,2);
  v_new_paid numeric(10,2);
  v_new_status text;
BEGIN
  SELECT amount, payment_plan_id, school_id
  INTO v_payment_amount, v_payment_plan_id, v_school_id
  FROM public.payments
  WHERE id = p_payment_id;

  IF v_payment_amount IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Payment not found');
  END IF;

  v_remaining := v_payment_amount;

  FOR v_installment IN
    SELECT
      id,
      installment_number,
      amount_due,
      COALESCE(amount_paid, 0) AS amount_paid
    FROM public.installments
    WHERE payment_plan_id = v_payment_plan_id
      AND status IN ('pendiente', 'parcial')
    ORDER BY installment_number ASC NULLS LAST, due_date ASC NULLS LAST, created_at ASC NULLS LAST
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_pending := GREATEST(COALESCE(v_installment.amount_due, 0) - COALESCE(v_installment.amount_paid, 0), 0);
    v_to_apply := LEAST(v_remaining, v_pending);
    v_new_paid := COALESCE(v_installment.amount_paid, 0) + v_to_apply;

    IF v_new_paid >= COALESCE(v_installment.amount_due, 0) THEN
      v_new_status := 'pagado';
    ELSE
      v_new_status := 'parcial';
    END IF;

    UPDATE public.installments
    SET
      amount_paid = v_new_paid,
      status = v_new_status,
      updated_at = now()
    WHERE id = v_installment.id;

    v_applied := v_applied + v_to_apply;
    v_remaining := v_remaining - v_to_apply;
  END LOOP;

  SELECT pp.student_id, s.qr_token::text
  INTO v_student_id, v_qr_token
  FROM public.payment_plans pp
  JOIN public.students s ON s.id = pp.student_id
  WHERE pp.id = v_payment_plan_id;

  IF v_student_id IS NOT NULL THEN
    INSERT INTO public.attendance_qr_log (
      school_id,
      student_id,
      qr_token,
      action,
      notes
    ) VALUES (
      v_school_id,
      v_student_id,
      COALESCE(v_qr_token, ''),
      'payment',
      format(
        'Pago de S/ %.2f aplicado. Crédito restante: S/ %.2f',
        v_payment_amount,
        GREATEST(v_remaining, 0)
      )
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'amount_applied', v_applied,
    'credit_remaining', GREATEST(v_remaining, 0)::numeric(10,2)
  );
END;
$$;
