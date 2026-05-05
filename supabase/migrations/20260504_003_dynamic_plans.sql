CREATE OR REPLACE FUNCTION public.fn_generate_installments(
  p_payment_plan_id uuid,
  p_num_installments integer,
  p_first_due_date date,
  p_frequency_days integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school_id uuid;
  v_total numeric(10,2);
  v_amount_per numeric(10,2);
BEGIN
  SELECT school_id, total_amount
  INTO v_school_id, v_total
  FROM public.payment_plans
  WHERE id = p_payment_plan_id;

  v_amount_per := ROUND(v_total / p_num_installments, 2);

  FOR i IN 1..p_num_installments LOOP
    INSERT INTO public.installments (
      school_id,
      payment_plan_id,
      installment_number,
      due_date,
      amount_due,
      amount_paid,
      status
    ) VALUES (
      v_school_id,
      p_payment_plan_id,
      i,
      p_first_due_date + ((i - 1) * p_frequency_days),
      v_amount_per,
      0,
      'pendiente'
    );
  END LOOP;
END;
$$;
