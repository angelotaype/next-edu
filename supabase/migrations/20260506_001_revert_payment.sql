CREATE OR REPLACE FUNCTION public.fn_revert_payment(
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
  v_paid_at timestamptz;
  v_student_id uuid;
  v_qr_token text;
  v_installment record;
  v_remaining numeric(10,2);
  v_to_revert numeric(10,2);
  v_new_paid numeric(10,2);
  v_new_status text;
BEGIN
  SELECT amount, payment_plan_id, school_id, paid_at
  INTO v_payment_amount, v_payment_plan_id, v_school_id, v_paid_at
  FROM public.payments
  WHERE id = p_payment_id
    AND deleted_at IS NULL;

  IF v_payment_amount IS NULL THEN
    RETURN json_build_object('error', 'Pago no encontrado');
  END IF;

  IF v_paid_at < NOW() - INTERVAL '24 hours' THEN
    RETURN json_build_object('error', 'Pago fuera del rango de reversión (24h)');
  END IF;

  v_remaining := v_payment_amount;

  FOR v_installment IN
    SELECT id, amount_due, amount_paid
    FROM public.installments
    WHERE payment_plan_id = v_payment_plan_id
      AND status IN ('parcial', 'pagado')
    ORDER BY installment_number DESC
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_to_revert := LEAST(v_remaining, COALESCE(v_installment.amount_paid, 0));
    v_new_paid := GREATEST(COALESCE(v_installment.amount_paid, 0) - v_to_revert, 0);

    IF v_new_paid = 0 THEN
      v_new_status := 'pendiente';
    ELSE
      v_new_status := 'parcial';
    END IF;

    UPDATE public.installments
    SET
      amount_paid = v_new_paid,
      status = v_new_status,
      updated_at = now()
    WHERE id = v_installment.id;

    v_remaining := v_remaining - v_to_revert;
  END LOOP;

  UPDATE public.payments
  SET
    deleted_at = now(),
    updated_at = now()
  WHERE id = p_payment_id;

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
      notes,
      scanned_at
    ) VALUES (
      v_school_id,
      v_student_id,
      COALESCE(v_qr_token, ''),
      'payment_reverted',
      'Pago de S/ ' || v_payment_amount || ' revertido',
      NOW()
    );
  END IF;

  RETURN json_build_object('success', true, 'amount_reverted', v_payment_amount);
END;
$$;
