-- Fix 1: Replace overly permissive profiles SELECT policy
-- Users should only see profiles of people they interact with
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create a helper function to check if users have interactions
CREATE OR REPLACE FUNCTION public.can_view_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Own profile
    SELECT 1 WHERE profile_id = auth.uid()
  ) OR EXISTS (
    -- Donor viewing receiver who requested their donation
    SELECT 1 FROM donation_requests dr
    JOIN food_donations fd ON dr.donation_id = fd.id
    WHERE fd.donor_id = auth.uid() AND dr.receiver_id = profile_id
  ) OR EXISTS (
    -- Receiver viewing donor of a donation they requested
    SELECT 1 FROM donation_requests dr
    JOIN food_donations fd ON dr.donation_id = fd.id
    WHERE dr.receiver_id = auth.uid() AND fd.donor_id = profile_id
  ) OR EXISTS (
    -- Anyone involved in a delivery can see delivery person
    SELECT 1 FROM deliveries d
    JOIN food_donations fd ON d.donation_id = fd.id
    JOIN donation_requests dr ON d.request_id = dr.id
    WHERE d.delivery_person_id = profile_id
    AND (fd.donor_id = auth.uid() OR dr.receiver_id = auth.uid() OR d.delivery_person_id = auth.uid())
  ) OR EXISTS (
    -- Delivery person can see donor and receiver
    SELECT 1 FROM deliveries d
    JOIN food_donations fd ON d.donation_id = fd.id
    JOIN donation_requests dr ON d.request_id = dr.id
    WHERE d.delivery_person_id = auth.uid()
    AND (fd.donor_id = profile_id OR dr.receiver_id = profile_id)
  );
$$;

-- Create new scoped SELECT policy
CREATE POLICY "Users can view relevant profiles"
ON profiles FOR SELECT
USING (public.can_view_profile(id));


-- Fix 2: Secure delivery creation with RPC function
DROP POLICY IF EXISTS "System can create deliveries" ON deliveries;

-- Create secure delivery creation function
CREATE OR REPLACE FUNCTION public.create_delivery(
  p_donation_id uuid,
  p_request_id uuid,
  p_delivery_person_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delivery_id uuid;
  v_donor_id uuid;
BEGIN
  -- Verify caller is the donor of this donation
  SELECT donor_id INTO v_donor_id FROM food_donations WHERE id = p_donation_id;
  
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'Donation not found';
  END IF;
  
  IF v_donor_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Only the donor can create deliveries for their donations';
  END IF;
  
  -- Insert the delivery record
  INSERT INTO deliveries (donation_id, request_id, delivery_person_id, status)
  VALUES (p_donation_id, p_request_id, p_delivery_person_id, 'assigned')
  RETURNING id INTO v_delivery_id;
  
  RETURN v_delivery_id;
END;
$$;

-- Block direct inserts, only allow through RPC
CREATE POLICY "Only RPC can create deliveries" 
ON deliveries FOR INSERT 
WITH CHECK (false);