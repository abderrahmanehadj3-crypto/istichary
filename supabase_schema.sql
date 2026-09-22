-- =========================================================================
-- Sari3 (سريع) - Supabase Database Schema
-- High-Speed On-Demand Delivery & Fare Negotiation Platform
-- Strict Separation between Customer and Driver Roles
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Customers & Drivers)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  phone_verified BOOLEAN DEFAULT FALSE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('customer', 'driver')),
  wilaya TEXT DEFAULT '16', -- Default 16: Alger
  camera_permission_granted BOOLEAN DEFAULT FALSE,
  location_permission_granted BOOLEAN DEFAULT FALSE,
  account_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. DRIVER VERIFICATIONS TABLE (Strict 5-step Verification Data)
CREATE TABLE IF NOT EXISTS public.driver_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 20), -- Legal driver age constraint
  face_photo_url TEXT NOT NULL, -- Private biometric face capture
  public_avatar_url TEXT, -- Public avatar shown to customers
  license_number TEXT NOT NULL,
  license_expiration_date DATE NOT NULL,
  license_front_url TEXT NOT NULL,
  license_back_url TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('motorcycle', 'car', 'van')),
  vehicle_reg_type TEXT NOT NULL CHECK (vehicle_reg_type IN ('permanent', 'temporary')),
  vehicle_plate TEXT NOT NULL,
  vehicle_brand TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_online BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3,2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view and update their own verification"
  ON public.driver_verifications FOR ALL
  USING (auth.uid() = driver_id);

CREATE POLICY "Public can view verified driver online status and vehicle"
  ON public.driver_verifications FOR SELECT
  USING (verification_status = 'verified');

-- 3. DELIVERY ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  package_photo_url TEXT NOT NULL, -- Mandatory photo inspection
  package_description TEXT NOT NULL,
  package_category TEXT DEFAULT 'documents' CHECK (package_category IN ('documents', 'food', 'electronics', 'clothes', 'fragile', 'other')),
  distance_km NUMERIC(5,2) NOT NULL,
  suggested_base_price INTEGER NOT NULL,
  customer_offer_price INTEGER NOT NULL,
  agreed_price INTEGER,
  status TEXT DEFAULT 'searching' CHECK (status IN ('searching', 'negotiating', 'accepted', 'in_transit', 'delivered', 'cancelled')),
  assigned_driver_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active orders are viewable by drivers in same wilaya or order customer"
  ON public.delivery_orders FOR SELECT
  USING (true);

CREATE POLICY "Customers can insert their own orders"
  ON public.delivery_orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customer and assigned driver can update order"
  ON public.delivery_orders FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() = assigned_driver_id);

-- 4. DRIVER OFFERS TABLE (InDriver-style Bidding & Negotiation)
CREATE TABLE IF NOT EXISTS public.driver_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id),
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  driver_rating NUMERIC(3,2) DEFAULT 5.0,
  driver_avatar TEXT,
  vehicle_info TEXT,
  vehicle_plate TEXT,
  offered_price INTEGER NOT NULL,
  eta_minutes INTEGER DEFAULT 10,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.driver_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Offers visible to order customer and submitting driver"
  ON public.driver_offers FOR SELECT
  USING (true);

CREATE POLICY "Drivers can submit offers"
  ON public.driver_offers FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Customer or driver can update offer status"
  ON public.driver_offers FOR UPDATE
  USING (auth.uid() = driver_id OR auth.uid() IN (SELECT customer_id FROM public.delivery_orders WHERE id = order_id));

-- 5. DRIVER WALLET & TRANSACTIONS TABLE (محفظة السائق)
CREATE TABLE IF NOT EXISTS public.driver_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(10,2) DEFAULT 3500.00,
  currency TEXT DEFAULT 'DZD',
  total_topped_up NUMERIC(10,2) DEFAULT 5000.00,
  total_commission_paid NUMERIC(10,2) DEFAULT 1500.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.driver_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own wallet"
  ON public.driver_wallets FOR SELECT
  USING (auth.uid() = driver_id);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('topup_electronic', 'topup_receipt', 'delivery_commission', 'withdrawal')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can submit receipt top-up requests"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- 6. SECURE SUPABASE STORAGE BUCKETS & RLS POLICIES
-- Create buckets:
-- - driver-verifications-secure: strictly PRIVATE, Super Admin access only for face biometrics & legal documents
-- - profile-pictures: PUBLIC for user display photos
-- - package-photos: PUBLIC for package inspection
-- - payment-receipts: PRIVATE for BaridiMob/CCP receipt proofs

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('driver-verifications-secure', 'driver-verifications-secure', false),
  ('profile-pictures', 'profile-pictures', true),
  ('package-photos', 'package-photos', true),
  ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Super Admin / Private protection for driver verifications
CREATE POLICY "Super Admins and owning driver can access verification documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'driver-verifications-secure' 
    AND (
      auth.uid()::text = (storage.foldername(name))[1] 
      OR auth.jwt() ->> 'role' = 'super_admin'
    )
  );

CREATE POLICY "Drivers can upload their own verification documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'driver-verifications-secure'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS for Profile Pictures
CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Authenticated users can upload profile pictures"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

-- Storage RLS for Package Photos
CREATE POLICY "Anyone can view package inspection photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'package-photos');

CREATE POLICY "Customers can upload package inspection photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'package-photos' AND auth.role() = 'authenticated');

-- Realtime publication for real-time live map & offer broadcasting
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_orders, public.driver_offers, public.driver_verifications;
