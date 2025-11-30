-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('donor', 'receiver', 'delivery');

-- Create enum for donation status
CREATE TYPE public.donation_status AS ENUM ('available', 'requested', 'confirmed', 'picked_up', 'delivered', 'cancelled');

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create enum for delivery status
CREATE TYPE public.delivery_status AS ENUM ('assigned', 'in_transit', 'delivered', 'failed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  user_type user_type NOT NULL,
  organization_name TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create food_donations table
CREATE TABLE public.food_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  food_type TEXT NOT NULL,
  quantity TEXT NOT NULL,
  serves_people INTEGER,
  expiry_date TIMESTAMPTZ NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  status donation_status NOT NULL DEFAULT 'available',
  images TEXT[],
  allergens TEXT[],
  dietary_info TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create donation_requests table
CREATE TABLE public.donation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.food_donations(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'pending',
  message TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(donation_id, receiver_id)
);

-- Create deliveries table
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.food_donations(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.donation_requests(id) ON DELETE CASCADE,
  delivery_person_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status delivery_status NOT NULL DEFAULT 'assigned',
  pickup_time TIMESTAMPTZ,
  delivery_time TIMESTAMPTZ,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Food Donations RLS Policies
CREATE POLICY "Anyone can view available donations"
  ON public.food_donations FOR SELECT
  USING (status = 'available' OR donor_id = auth.uid());

CREATE POLICY "Donors can create donations"
  ON public.food_donations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update own donations"
  ON public.food_donations FOR UPDATE
  USING (auth.uid() = donor_id);

CREATE POLICY "Donors can delete own donations"
  ON public.food_donations FOR DELETE
  USING (auth.uid() = donor_id);

-- Donation Requests RLS Policies
CREATE POLICY "Users can view requests for their donations or their own requests"
  ON public.donation_requests FOR SELECT
  USING (
    auth.uid() = receiver_id 
    OR auth.uid() IN (
      SELECT donor_id FROM public.food_donations WHERE id = donation_id
    )
  );

CREATE POLICY "Receivers can create requests"
  ON public.donation_requests FOR INSERT
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Users can update requests they're involved in"
  ON public.donation_requests FOR UPDATE
  USING (
    auth.uid() = receiver_id 
    OR auth.uid() IN (
      SELECT donor_id FROM public.food_donations WHERE id = donation_id
    )
  );

-- Deliveries RLS Policies
CREATE POLICY "Users can view deliveries they're involved in"
  ON public.deliveries FOR SELECT
  USING (
    auth.uid() = delivery_person_id
    OR auth.uid() IN (
      SELECT donor_id FROM public.food_donations WHERE id = donation_id
    )
    OR auth.uid() IN (
      SELECT receiver_id FROM public.donation_requests WHERE id = request_id
    )
  );

CREATE POLICY "Delivery persons can update their deliveries"
  ON public.deliveries FOR UPDATE
  USING (auth.uid() = delivery_person_id);

CREATE POLICY "System can create deliveries"
  ON public.deliveries FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_food_donations_updated_at
  BEFORE UPDATE ON public.food_donations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'receiver')
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();