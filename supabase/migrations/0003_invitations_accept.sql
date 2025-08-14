-- Invitation acceptance function to add membership securely
-- Idempotent migration

BEGIN;

-- Function: accept_invitation(invite_code)
CREATE OR REPLACE FUNCTION public.accept_invitation(invite_code uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid;
  v_role public.user_role;
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Redeem and validate invitation (increments uses, sets used_by/used_at)
  SELECT store_id, role INTO v_store_id, v_role
  FROM public.redeem_invitation(invite_code);

  -- Upsert membership for the accepting user
  INSERT INTO public.store_users (store_id, user_id, role)
  VALUES (v_store_id, v_user, COALESCE(v_role, 'staff'))
  ON CONFLICT (store_id, user_id)
  DO UPDATE SET role = EXCLUDED.role;

  -- Ensure profile exists and is at least staff
  INSERT INTO public.profiles (id, role)
  VALUES (v_user, COALESCE(v_role, 'staff'))
  ON CONFLICT (id) DO UPDATE SET role = GREATEST(profiles.role, EXCLUDED.role);

  RETURN v_store_id;
END;
$$;

-- Grant execute
DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid) TO authenticated;
EXCEPTION WHEN undefined_object THEN
  NULL;
END
$$;

COMMIT;


