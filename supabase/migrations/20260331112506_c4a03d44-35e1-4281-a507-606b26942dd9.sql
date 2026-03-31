
CREATE TABLE public.auto_pay_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  rule_name text NOT NULL DEFAULT 'My Auto Pay Rule',
  max_price numeric NOT NULL DEFAULT 200,
  min_ai_score integer NOT NULL DEFAULT 70,
  quality_grades text[] NOT NULL DEFAULT '{"A+","A","B"}',
  provinces text[] NOT NULL DEFAULT '{}',
  buyer_types text[] NOT NULL DEFAULT '{}',
  daily_budget numeric NOT NULL DEFAULT 500,
  daily_spent numeric NOT NULL DEFAULT 0,
  max_leads_per_day integer NOT NULL DEFAULT 10,
  leads_purchased_today integer NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_pay_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can manage own auto pay rules"
  ON public.auto_pay_rules FOR ALL
  USING (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()))
  WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all auto pay rules"
  ON public.auto_pay_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_auto_pay_rules_updated_at
  BEFORE UPDATE ON public.auto_pay_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
