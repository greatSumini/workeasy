-- Manager-only signup support: extend stores and provide RPC to create store as owner
-- Idempotent migration

BEGIN;

-- 1) Extend stores with optional address and phone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'address'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN address text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN phone text;
  END IF;
END
$$;

-- 2) RPC: create_store_as_owner
CREATE OR REPLACE FUNCTION public.create_store_as_owner(
  store_name text,
  store_address text DEFAULT NULL,
  store_phone text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_store_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF store_name IS NULL OR length(btrim(store_name)) < 2 THEN
    RAISE EXCEPTION 'Invalid store name';
  END IF;

  -- ensure profile is manager
  UPDATE public.profiles SET role = 'manager'::public.user_role
  WHERE id = v_user AND role <> 'manager';

  INSERT INTO public.stores (name, owner_id, address, phone)
  VALUES (btrim(store_name), v_user, store_address, store_phone)
  RETURNING id INTO v_store_id;

  -- add membership as manager (idempotent with uq constraint)
  INSERT INTO public.store_users (store_id, user_id, role)
  VALUES (v_store_id, v_user, 'manager')
  ON CONFLICT (store_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN v_store_id;
END;
$$;

-- 3) grant execute to authenticated
DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION public.create_store_as_owner(text, text, text) TO authenticated;
EXCEPTION WHEN undefined_object THEN
  NULL;
END
$$;

COMMIT;


