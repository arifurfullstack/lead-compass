
CREATE OR REPLACE FUNCTION public.purchase_lead(
  _dealer_id uuid,
  _lead_id uuid,
  _price numeric,
  _tier text,
  _delivery_method text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_balance numeric;
  _new_balance numeric;
  _purchase_id uuid;
  _lead_status text;
BEGIN
  -- Lock the dealer row to prevent concurrent balance issues
  SELECT wallet_balance INTO _current_balance
  FROM dealers WHERE id = _dealer_id
  FOR UPDATE;

  IF _current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dealer not found');
  END IF;

  -- Check balance
  IF _current_balance < _price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance', 'balance', _current_balance);
  END IF;

  -- Lock and check lead status
  SELECT sold_status INTO _lead_status
  FROM leads WHERE id = _lead_id
  FOR UPDATE;

  IF _lead_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead not found');
  END IF;

  IF _lead_status <> 'available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead is no longer available');
  END IF;

  -- Deduct wallet
  _new_balance := _current_balance - _price;
  UPDATE dealers SET wallet_balance = _new_balance WHERE id = _dealer_id;

  -- Mark lead as sold
  UPDATE leads
  SET sold_status = 'sold',
      sold_at = now(),
      purchased_by_dealer_id = _dealer_id
  WHERE id = _lead_id;

  -- Create purchase record
  INSERT INTO purchases (dealer_id, lead_id, price_paid, dealer_tier_at_purchase, delivery_method)
  VALUES (_dealer_id, _lead_id, _price, _tier, _delivery_method)
  RETURNING id INTO _purchase_id;

  -- Create wallet transaction record
  INSERT INTO wallet_transactions (dealer_id, amount, balance_after, type, description, reference_id)
  VALUES (_dealer_id, -_price, _new_balance, 'purchase', 'Lead purchase: ' || _lead_id::text, _purchase_id::text);

  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', _purchase_id,
    'new_balance', _new_balance
  );
END;
$$;
