-- ====================================================================
-- KABADIWALA CONNECT — PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- Smart India Hackathon 2026 (Problem Statement #229)
-- ====================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('COLLECTOR', 'RECYCLER', 'ADMIN')),
  language TEXT DEFAULT 'hi' CHECK (language IN ('hi', 'mr', 'en')),
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COLLECTORS TABLE
CREATE TABLE IF NOT EXISTS public.collectors (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  kyc_status TEXT DEFAULT 'NOT_SUBMITTED',
  badge TEXT,
  total_weight_collected NUMERIC DEFAULT 0,
  total_lots_created INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  upi_id TEXT,
  data_source TEXT DEFAULT 'LIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RECYCLERS TABLE
CREATE TABLE IF NOT EXISTS public.recyclers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  facility_name TEXT NOT NULL,
  registration_no TEXT NOT NULL,
  authorization_status TEXT NOT NULL,
  authorization_source TEXT NOT NULL,
  auth_valid_until TEXT,
  contact_person TEXT,
  contact_phone TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  accepted_materials JSONB DEFAULT '[]'::jsonb,
  pickup_available BOOLEAN DEFAULT true,
  service_radius_km NUMERIC DEFAULT 25,
  base_offered_rates JSONB DEFAULT '{}'::jsonb,
  rating NUMERIC DEFAULT 4.5,
  total_processed_kg NUMERIC DEFAULT 0,
  data_source TEXT DEFAULT 'LIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LOTS TABLE
CREATE TABLE IF NOT EXISTS public.lots (
  id TEXT PRIMARY KEY,
  collector_id TEXT REFERENCES public.collectors(id) ON DELETE CASCADE,
  collector_name TEXT NOT NULL,
  collector_phone TEXT NOT NULL,
  material_category TEXT NOT NULL,
  sub_category TEXT,
  description TEXT,
  image_url TEXT,
  image_urls JSONB DEFAULT '[]'::jsonb,
  approx_weight NUMERIC NOT NULL,
  actual_weight NUMERIC,
  condition TEXT NOT NULL,
  source_type TEXT NOT NULL,
  location_district TEXT NOT NULL,
  location_state TEXT NOT NULL,
  estimated_value_min NUMERIC NOT NULL,
  estimated_value_max NUMERIC NOT NULL,
  estimated_value_avg NUMERIC NOT NULL,
  quoted_price NUMERIC,
  final_sale_value NUMERIC,
  selected_recycler_id TEXT,
  selected_offer_id TEXT,
  handover_otp TEXT,
  status TEXT NOT NULL,
  data_source TEXT DEFAULT 'LIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OFFERS TABLE
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY,
  lot_id TEXT REFERENCES public.lots(id) ON DELETE CASCADE,
  recycler_id TEXT REFERENCES public.recyclers(id) ON DELETE CASCADE,
  recycler_name TEXT NOT NULL,
  material_category TEXT NOT NULL,
  offered_rate_per_kg NUMERIC NOT NULL,
  quoted_total_price NUMERIC NOT NULL,
  pickup_offered BOOLEAN DEFAULT true,
  pickup_charge_deduction NUMERIC DEFAULT 0,
  net_collector_payout NUMERIC NOT NULL,
  estimated_pickup_date TEXT,
  status TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PICKUPS TABLE
CREATE TABLE IF NOT EXISTS public.pickups (
  id TEXT PRIMARY KEY,
  lot_id TEXT REFERENCES public.lots(id) ON DELETE CASCADE,
  offer_id TEXT,
  collector_id TEXT REFERENCES public.collectors(id) ON DELETE CASCADE,
  recycler_id TEXT REFERENCES public.recyclers(id) ON DELETE CASCADE,
  scheduled_date TEXT NOT NULL,
  scheduled_time_slot TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_number TEXT,
  pickup_status TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  collector_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. HANDOVERS TABLE
CREATE TABLE IF NOT EXISTS public.handovers (
  id TEXT PRIMARY KEY,
  lot_id TEXT REFERENCES public.lots(id) ON DELETE CASCADE,
  pickup_id TEXT,
  collector_id TEXT REFERENCES public.collectors(id) ON DELETE CASCADE,
  recycler_id TEXT REFERENCES public.recyclers(id) ON DELETE CASCADE,
  recycler_name TEXT NOT NULL,
  approx_weight NUMERIC NOT NULL,
  initial_estimated_weight NUMERIC NOT NULL,
  actual_weight NUMERIC NOT NULL,
  weight_difference NUMERIC NOT NULL,
  weight_diff_percentage NUMERIC NOT NULL,
  proof_image_url TEXT NOT NULL,
  handover_otp TEXT NOT NULL,
  gps_location JSONB NOT NULL,
  location_source TEXT NOT NULL,
  device_accuracy_meters NUMERIC,
  verified_by_recycler_name TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_record_type TEXT NOT NULL,
  external_gateway_status TEXT NOT NULL,
  final_payment_amount NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TRACEABILITY LOGS (SHA-256 Merkle Chain)
CREATE TABLE IF NOT EXISTS public.traceability_logs (
  id TEXT PRIMARY KEY,
  lot_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  facility_location TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data_source TEXT DEFAULT 'LIVE',
  previous_event_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  event_hash TEXT NOT NULL
);

-- 9. PRICES TABLE (Mandi Rates)
CREATE TABLE IF NOT EXISTS public.prices (
  id TEXT PRIMARY KEY,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  material_category TEXT NOT NULL,
  prevailing_buy_price NUMERIC NOT NULL,
  min_price NUMERIC NOT NULL,
  max_price NUMERIC NOT NULL,
  trend TEXT NOT NULL,
  source_type TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PRICE HISTORY LOG
CREATE TABLE IF NOT EXISTS public.price_history_log (
  id TEXT PRIMARY KEY,
  district TEXT NOT NULL,
  material_category TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  date TEXT NOT NULL,
  source TEXT NOT NULL
);

-- 11. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  lot_id TEXT NOT NULL,
  collector_id TEXT NOT NULL,
  recycler_id TEXT NOT NULL,
  recycler_name TEXT NOT NULL,
  material_category TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  rate_per_kg NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  record_type TEXT NOT NULL,
  payout_status TEXT NOT NULL,
  external_gateway_status TEXT NOT NULL,
  status TEXT NOT NULL,
  transaction_ref TEXT NOT NULL,
  data_source TEXT DEFAULT 'LIVE',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ANOMALIES TABLE
CREATE TABLE IF NOT EXISTS public.anomalies (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  flagged_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- 13. DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.disputes (
  id TEXT PRIMARY KEY,
  lot_id TEXT NOT NULL,
  collector_id TEXT NOT NULL,
  recycler_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- 14. ML TRAINING SAMPLES
CREATE TABLE IF NOT EXISTS public.ml_training_samples (
  id TEXT PRIMARY KEY,
  lot_id TEXT NOT NULL,
  image_path TEXT NOT NULL,
  initial_heuristic_prediction TEXT NOT NULL,
  user_confirmed_category TEXT NOT NULL,
  is_override BOOLEAN DEFAULT false,
  collector_id TEXT NOT NULL,
  district TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CPCB MASTER REGISTRY
CREATE TABLE IF NOT EXISTS public.cpcb_master_registry (
  registration_no TEXT PRIMARY KEY,
  facility_name TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT NOT NULL,
  authorized_capacity_mta NUMERIC NOT NULL,
  valid_until TEXT NOT NULL,
  categories_authorized JSONB DEFAULT '[]'::jsonb
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_lots_collector ON public.lots(collector_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON public.lots(status);
CREATE INDEX IF NOT EXISTS idx_offers_lot ON public.offers(lot_id);
CREATE INDEX IF NOT EXISTS idx_traceability_lot ON public.traceability_logs(lot_id);
CREATE INDEX IF NOT EXISTS idx_payments_lot ON public.payments(lot_id);
CREATE INDEX IF NOT EXISTS idx_prices_district ON public.prices(district);

-- ENABLE SUPABASE REALTIME REPLICATION ON KEY TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.lots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.handovers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;

-- PERMISSIONS / ACCESS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recyclers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.handovers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.traceability_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomalies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_samples DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpcb_master_registry DISABLE ROW LEVEL SECURITY;
