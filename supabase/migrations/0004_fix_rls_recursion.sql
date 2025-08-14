-- Fix RLS recursion by replacing cross-table subqueries in policies
-- with SECURITY DEFINER helper functions.

BEGIN;

-- 1) Helper functions (bypass RLS by running as owner)
CREATE OR REPLACE FUNCTION public.is_store_member(p_user uuid, p_store uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_users su
    WHERE su.store_id = p_store AND su.user_id = p_user
  );
$$;

CREATE OR REPLACE FUNCTION public.is_store_owner(p_user uuid, p_store uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store AND s.owner_id = p_user
  );
$$;

DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION public.is_store_member(uuid, uuid) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.is_store_owner(uuid, uuid) TO authenticated;
EXCEPTION WHEN undefined_object THEN
  NULL;
END
$$;

-- 2) Recreate policies using helper functions (to avoid recursion)

-- stores
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Stores select for members or owner'
  ) THEN
    DROP POLICY "Stores select for members or owner" ON public.stores;
  END IF;
  CREATE POLICY "Stores select for members or owner" ON public.stores
    FOR SELECT USING (
      public.is_store_owner(auth.uid(), id) OR public.is_store_member(auth.uid(), id)
    );
END
$$;

-- store_users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'store_users' AND policyname = 'StoreUsers select for members and owner'
  ) THEN
    DROP POLICY "StoreUsers select for members and owner" ON public.store_users;
  END IF;
  CREATE POLICY "StoreUsers select for members and owner" ON public.store_users
    FOR SELECT USING (
      user_id = auth.uid() OR public.is_store_owner(auth.uid(), store_id)
    );

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'store_users' AND policyname = 'StoreUsers insert by owner'
  ) THEN
    DROP POLICY "StoreUsers insert by owner" ON public.store_users;
  END IF;
  CREATE POLICY "StoreUsers insert by owner" ON public.store_users
    FOR INSERT WITH CHECK (
      public.is_store_owner(auth.uid(), store_id)
    );

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'store_users' AND policyname = 'StoreUsers update by owner'
  ) THEN
    DROP POLICY "StoreUsers update by owner" ON public.store_users;
  END IF;
  CREATE POLICY "StoreUsers update by owner" ON public.store_users
    FOR UPDATE USING (
      public.is_store_owner(auth.uid(), store_id)
    ) WITH CHECK (
      public.is_store_owner(auth.uid(), store_id)
    );

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'store_users' AND policyname = 'StoreUsers delete by owner'
  ) THEN
    DROP POLICY "StoreUsers delete by owner" ON public.store_users;
  END IF;
  CREATE POLICY "StoreUsers delete by owner" ON public.store_users
    FOR DELETE USING (
      public.is_store_owner(auth.uid(), store_id)
    );
END
$$;

-- invitations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invitations' AND policyname = 'Invitations select by owner or inviter'
  ) THEN
    DROP POLICY "Invitations select by owner or inviter" ON public.invitations;
  END IF;
  CREATE POLICY "Invitations select by owner or inviter" ON public.invitations
    FOR SELECT USING (
      inviter_id = auth.uid() OR public.is_store_owner(auth.uid(), store_id)
    );

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invitations' AND policyname = 'Invitations insert by owner'
  ) THEN
    DROP POLICY "Invitations insert by owner" ON public.invitations;
  END IF;
  CREATE POLICY "Invitations insert by owner" ON public.invitations
    FOR INSERT WITH CHECK (
      public.is_store_owner(auth.uid(), store_id)
    );

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invitations' AND policyname = 'Invitations update by owner or inviter'
  ) THEN
    DROP POLICY "Invitations update by owner or inviter" ON public.invitations;
  END IF;
  CREATE POLICY "Invitations update by owner or inviter" ON public.invitations
    FOR UPDATE USING (
      inviter_id = auth.uid() OR public.is_store_owner(auth.uid(), store_id)
    ) WITH CHECK (
      inviter_id = auth.uid() OR public.is_store_owner(auth.uid(), store_id)
    );

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invitations' AND policyname = 'Invitations delete by owner'
  ) THEN
    DROP POLICY "Invitations delete by owner" ON public.invitations;
  END IF;
  CREATE POLICY "Invitations delete by owner" ON public.invitations
    FOR DELETE USING (
      public.is_store_owner(auth.uid(), store_id)
    );
END
$$;

COMMIT;


