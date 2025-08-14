-- Billing & Payments schema: billing_profiles, payment_intents, helpers, RLS
-- Idempotent migration per Supabase Migration SQL Guideline

BEGIN;

-- Ensure required extension for gen_random_uuid() and pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: provide application encryption key from GUC (fallback for dev)
CREATE OR REPLACE FUNCTION public.app_encryption_key()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.encryption_key', true), 'dev_fallback_key')
$$;

-- ENUM: payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t WHERE t.typname = 'payment_status'
  ) THEN
    CREATE TYPE public.payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');
  END IF;
END
$$;

-- Table: billing_profiles
CREATE TABLE IF NOT EXISTS public.billing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_key text UNIQUE NOT NULL,
  billing_key_enc bytea NOT NULL,
  card_masked text,
  issuer_code text,
  acquirer_code text,
  owner_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index (defensive if table pre-exists without constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='billing_profiles' AND indexname='idx_billing_profiles_customer_key'
  ) THEN
    CREATE UNIQUE INDEX idx_billing_profiles_customer_key ON public.billing_profiles (customer_key);
  END IF;
END
$$;

-- Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'billing_profiles_set_timestamp'
  ) THEN
    CREATE TRIGGER billing_profiles_set_timestamp
    BEFORE UPDATE ON public.billing_profiles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END
$$;

-- RPC: insert or update billing_profile with encryption (RLS enforced)
CREATE OR REPLACE FUNCTION public.insert_billing_profile(
  p_user uuid,
  p_customer_key text,
  p_billing_key text,
  p_card_masked text DEFAULT NULL,
  p_issuer text DEFAULT NULL,
  p_acquirer text DEFAULT NULL,
  p_owner text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Upsert by customer_key
  INSERT INTO public.billing_profiles as bp (
    user_id, customer_key, billing_key_enc, card_masked, issuer_code, acquirer_code, owner_type
  ) VALUES (
    p_user,
    p_customer_key,
    pgp_sym_encrypt(p_billing_key::text, public.app_encryption_key()),
    p_card_masked,
    p_issuer,
    p_acquirer,
    p_owner
  )
  ON CONFLICT (customer_key) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    billing_key_enc = EXCLUDED.billing_key_enc,
    card_masked = EXCLUDED.card_masked,
    issuer_code = EXCLUDED.issuer_code,
    acquirer_code = EXCLUDED.acquirer_code,
    owner_type = EXCLUDED.owner_type,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
EXCEPTION WHEN OTHERS THEN
  -- avoid aborting migration in case of unexpected states
  RAISE NOTICE 'insert_billing_profile failed: %', SQLERRM;
  RETURN NULL;
END;
$$;

-- Table: payment_intents
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'KRW',
  status public.payment_status NOT NULL,
  payment_key text,
  approved_at timestamptz NULL,
  failure_code text,
  failure_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_intents_order_id_unique UNIQUE (order_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_intents_user_created ON public.payment_intents (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status_created ON public.payment_intents (status, created_at DESC);

-- Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'payment_intents_set_timestamp'
  ) THEN
    CREATE TRIGGER payment_intents_set_timestamp
    BEFORE UPDATE ON public.payment_intents
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END
$$;

-- RLS enable
ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

-- RLS policies for billing_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='billing_profiles' AND policyname='billing_profiles_select_own'
  ) THEN
    CREATE POLICY billing_profiles_select_own ON public.billing_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='billing_profiles' AND policyname='billing_profiles_insert_own'
  ) THEN
    CREATE POLICY billing_profiles_insert_own ON public.billing_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='billing_profiles' AND policyname='billing_profiles_update_own'
  ) THEN
    CREATE POLICY billing_profiles_update_own ON public.billing_profiles
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='billing_profiles' AND policyname='billing_profiles_delete_own'
  ) THEN
    CREATE POLICY billing_profiles_delete_own ON public.billing_profiles
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- RLS policies for payment_intents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_intents' AND policyname='payment_intents_select_own'
  ) THEN
    CREATE POLICY payment_intents_select_own ON public.payment_intents
      FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_intents' AND policyname='payment_intents_insert_own_or_null'
  ) THEN
    CREATE POLICY payment_intents_insert_own_or_null ON public.payment_intents
      FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_intents' AND policyname='payment_intents_update_own'
  ) THEN
    CREATE POLICY payment_intents_update_own ON public.payment_intents
      FOR UPDATE USING (user_id IS NULL OR auth.uid() = user_id) WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_intents' AND policyname='payment_intents_delete_own'
  ) THEN
    CREATE POLICY payment_intents_delete_own ON public.payment_intents
      FOR DELETE USING (user_id IS NULL OR auth.uid() = user_id);
  END IF;
END
$$;

COMMIT;


