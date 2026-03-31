
-- Fix: Drop the security definer view and recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.leads_public;
CREATE VIEW public.leads_public
WITH (security_invoker = true)
AS
  SELECT id, reference_code, initials, buyer_type, credit_range_min, credit_range_max,
         income, city, province, vehicle_preference, has_drivers_license, has_paystubs,
         has_bank_statements, has_credit_report, has_preapproval, ai_score, quality_grade,
         price, sold_status, sold_at, purchased_by_dealer_id, view_count, created_at
  FROM public.leads;
