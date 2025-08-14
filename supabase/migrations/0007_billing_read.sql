-- RPCs for reading encrypted billing key and safe payment updates
-- Idempotent migration per Supabase Migration SQL Guideline

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- RPC: get_billing_key - decrypt billing key for given user/customer
CREATE OR REPLACE FUNCTION public.get_billing_key(
  p_user uuid,
  p_customer_key text
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, extensions
AS $$
  SELECT pgp_sym_decrypt(bp.billing_key_enc, public.app_encryption_key())::text
  FROM public.billing_profiles bp
  WHERE bp.user_id = p_user AND bp.customer_key = p_customer_key
  LIMIT 1
$$;

DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION public.get_billing_key(uuid, text) TO authenticated;
EXCEPTION WHEN undefined_object THEN
  NULL;
END$$;

COMMIT;


