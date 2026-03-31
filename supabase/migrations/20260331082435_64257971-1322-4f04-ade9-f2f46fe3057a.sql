
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'dealer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Dealers table
CREATE TABLE public.dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  dealership_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  business_address TEXT,
  website TEXT,
  business_type TEXT,
  province TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'none' CHECK (subscription_tier IN ('none', 'basic', 'pro', 'elite', 'vip')),
  wallet_balance NUMERIC NOT NULL DEFAULT 0.00,
  notification_email TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  delivery_preference TEXT NOT NULL DEFAULT 'email' CHECK (delivery_preference IN ('email', 'webhook', 'both')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can read own record" ON public.dealers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Dealers can update own record" ON public.dealers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert dealer on signup" ON public.dealers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all dealers" ON public.dealers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT UNIQUE NOT NULL,
  initials TEXT NOT NULL,
  buyer_type TEXT NOT NULL CHECK (buyer_type IN ('online', 'in_store')),
  credit_range_min INTEGER NOT NULL,
  credit_range_max INTEGER NOT NULL,
  income NUMERIC,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  vehicle_preference TEXT,
  has_drivers_license BOOLEAN NOT NULL DEFAULT false,
  has_paystubs BOOLEAN NOT NULL DEFAULT false,
  has_bank_statements BOOLEAN NOT NULL DEFAULT false,
  has_credit_report BOOLEAN NOT NULL DEFAULT false,
  has_preapproval BOOLEAN NOT NULL DEFAULT false,
  ai_score INTEGER NOT NULL CHECK (ai_score >= 0 AND ai_score <= 100),
  quality_grade TEXT NOT NULL CHECK (quality_grade IN ('A+', 'A', 'B', 'C')),
  price NUMERIC NOT NULL,
  sold_status TEXT NOT NULL DEFAULT 'available' CHECK (sold_status IN ('available', 'sold')),
  sold_at TIMESTAMPTZ,
  purchased_by_dealer_id UUID REFERENCES public.dealers(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  lead_email TEXT NOT NULL,
  documents JSONB,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public view that hides PII
CREATE VIEW public.leads_public AS
  SELECT id, reference_code, initials, buyer_type, credit_range_min, credit_range_max,
         income, city, province, vehicle_preference, has_drivers_license, has_paystubs,
         has_bank_statements, has_credit_report, has_preapproval, ai_score, quality_grade,
         price, sold_status, sold_at, purchased_by_dealer_id, view_count, created_at
  FROM public.leads;

-- Dealers can see available leads (no PII via the view)
CREATE POLICY "Dealers can read available leads" ON public.leads
  FOR SELECT USING (
    sold_status = 'available'
    OR purchased_by_dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can manage all leads" ON public.leads
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'elite', 'vip')),
  price_monthly NUMERIC NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  stripe_subscription_id TEXT,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can read own subscriptions" ON public.subscriptions
  FOR SELECT USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('top_up', 'purchase', 'refund', 'adjustment')),
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  reference_id TEXT,
  description TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can read own transactions" ON public.wallet_transactions
  FOR SELECT USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all transactions" ON public.wallet_transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) NOT NULL,
  price_paid NUMERIC NOT NULL,
  dealer_tier_at_purchase TEXT NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'webhook', 'both')),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'partially_sent', 'failed')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can read own purchases" ON public.purchases
  FOR SELECT USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all purchases" ON public.purchases
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Delivery logs table
CREATE TABLE public.delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'webhook')),
  endpoint TEXT NOT NULL,
  payload_summary TEXT,
  response_code INTEGER,
  success BOOLEAN NOT NULL,
  error_details TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retry_count INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can read own delivery logs" ON public.delivery_logs
  FOR SELECT USING (purchase_id IN (
    SELECT p.id FROM public.purchases p
    JOIN public.dealers d ON p.dealer_id = d.id
    WHERE d.user_id = auth.uid()
  ));
CREATE POLICY "Admins can manage all delivery logs" ON public.delivery_logs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_dealers_updated_at
  BEFORE UPDATE ON public.dealers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
