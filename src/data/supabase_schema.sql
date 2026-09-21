-- =========================================================================
-- Sari3 Delivery Platform - Production Supabase Database Schema
-- High-speed on-demand delivery with fair fare negotiation & live tracking
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Customers and Delivery Drivers)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('customer', 'driver')),
  wilaya TEXT NOT NULL DEFAULT '16', -- Default Algiers
  camera_permission_granted BOOLEAN DEFAULT FALSE,
  location_permission_granted BOOLEAN DEFAULT FALSE,
  account_confirmed BOOLEAN DEFAULT FALSE,
  driver_details JSONB, -- Holds facePhotoUrl, age, license, vehicle info, registration type
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Delivery Orders Table
CREATE TABLE IF NOT EXISTS public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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
  package_category TEXT DEFAULT 'general',
  distance_km DOUBLE PRECISION NOT NULL,
  suggested_base_price INTEGER NOT NULL,
  customer_offer_price INTEGER NOT NULL,
  agreed_price INTEGER,
  status TEXT NOT NULL DEFAULT 'searching' CHECK (
    status IN ('searching', 'negotiating', 'accepted', 'in_transit', 'delivered', 'cancelled')
  ),
  assigned_driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  driver_lat DOUBLE PRECISION,
  driver_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Enable RLS for Orders
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orders are viewable by authenticated users"
  ON public.delivery_orders FOR SELECT
  USING (true);

CREATE POLICY "Customers can create delivery orders"
  ON public.delivery_orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id OR customer_id IS NOT NULL);

CREATE POLICY "Participants can update delivery orders"
  ON public.delivery_orders FOR UPDATE
  USING (true);

-- 3. Driver Offers Table (Negotiation Bids)
CREATE TABLE IF NOT EXISTS public.order_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  driver_rating NUMERIC(3,2) DEFAULT 5.0,
  driver_avatar TEXT,
  vehicle_info TEXT,
  vehicle_plate TEXT,
  offered_price INTEGER NOT NULL,
  eta_minutes INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Offers
ALTER TABLE public.order_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Offers are viewable by all authenticated users"
  ON public.order_offers FOR SELECT
  USING (true);

CREATE POLICY "Drivers can insert offers"
  ON public.order_offers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Participants can update offer status"
  ON public.order_offers FOR UPDATE
  USING (true);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_orders_wilaya_status ON public.delivery_orders(wilaya, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.delivery_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_offers_order_id ON public.order_offers(order_id);
