-- workeasy: Roles, Stores, Store Users, Invitations schema
-- Idempotent migration per Supabase Migration SQL Guideline

BEGIN;

-- Ensure required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) ENUM: user_role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t WHERE t.typname = 'user_role'
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('manager', 'staff');
  END IF;
END
$$;

-- 2) Common updated_at trigger function (idempotent via CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3) profiles: application-level user profile linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'staff',
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- trigger for profiles.updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_set_timestamp'
  ) THEN
    CREATE TRIGGER profiles_set_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END
$$;

-- insert profiles for existing auth.users without a profile
INSERT INTO public.profiles (id, role)
SELECT u.id, 'staff'::public.user_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- auto-create profile when a new auth user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'staff')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- 4) stores: shop information
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'stores_set_timestamp'
  ) THEN
    CREATE TRIGGER stores_set_timestamp
    BEFORE UPDATE ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END
$$;

-- 5) store_users: relation between stores and users (with role)
CREATE TABLE IF NOT EXISTS public.store_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_store_user UNIQUE (store_id, user_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'store_users_set_timestamp'
  ) THEN
    CREATE TRIGGER store_users_set_timestamp
    BEFORE UPDATE ON public.store_users
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END
$$;

-- 6) invitations: store invitation codes with expiry and usage limits
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  invitee_email text,
  code uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  role public.user_role NOT NULL DEFAULT 'staff',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  max_uses integer NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
  uses integer NOT NULL DEFAULT 0 CHECK (uses >= 0),
  used_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_uses_not_exceed CHECK (uses <= max_uses)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'invitations_set_timestamp'
  ) THEN
    CREATE TRIGGER invitations_set_timestamp
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END
$$;

-- 7) RLS enable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 8) RLS Policies (idempotent via pg_policies checks)

-- profiles: users can view/update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles select own'
  ) THEN
    CREATE POLICY "Profiles select own" ON public.profiles
      FOR SELECT USING (id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles update own'
  ) THEN
    CREATE POLICY "Profiles update own" ON public.profiles
      FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END
$$;

-- stores: owner can manage; members can read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Stores insert as owner'
  ) THEN
    CREATE POLICY "Stores insert as owner" ON public.stores
      FOR INSERT WITH CHECK (owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Stores select for members or owner'
  ) THEN
    CREATE POLICY "Stores select for members or owner" ON public.stores
      FOR SELECT USING (
        owner_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.store_users su
          WHERE su.store_id = stores.id AND su.user_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Stores update by owner'
  ) THEN
    CREATE POLICY "Stores update by owner" ON public.stores
      FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Stores delete by owner'
  ) THEN
    CREATE POLICY "Stores delete by owner" ON public.stores
      FOR DELETE USING (owner_id = auth.uid());
  END IF;
END
$$;

-- store_users: owner manages membership; members can read own store memberships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'store_users' AND policyname = 'StoreUsers select for members and owner'
  ) THEN
    CREATE POLICY "StoreUsers select for members and owner" ON public.store_users
      FOR SELECT USING (
        user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.stores s WHERE s.id = store_users.store_id AND s.owner_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'store_users' AND policyname = 'StoreUsers insert by owner'
  ) THEN
    CREATE POLICY "StoreUsers insert by owner" ON public.store_users
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.stores s WHERE s.id = store_users.store_id AND s.owner_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'store_users' AND policyname = 'StoreUsers update by owner'
  ) THEN
    CREATE POLICY "StoreUsers update by owner" ON public.store_users
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.stores s WHERE s.id = store_users.store_id AND s.owner_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.stores s WHERE s.id = store_users.store_id AND s.owner_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'store_users' AND policyname = 'StoreUsers delete by owner'
  ) THEN
    CREATE POLICY "StoreUsers delete by owner" ON public.store_users
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.stores s WHERE s.id = store_users.store_id AND s.owner_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- invitations: owners or inviter access; insert/update/delete restricted to owner
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invitations' AND policyname = 'Invitations select by owner or inviter'
  ) THEN
    CREATE POLICY "Invitations select by owner or inviter" ON public.invitations
      FOR SELECT USING (
        inviter_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.stores s WHERE s.id = invitations.store_id AND s.owner_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invitations' AND policyname = 'Invitations insert by owner'
  ) THEN
    CREATE POLICY "Invitations insert by owner" ON public.invitations
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.stores s WHERE s.id = invitations.store_id AND s.owner_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invitations' AND policyname = 'Invitations update by owner or inviter'
  ) THEN
    CREATE POLICY "Invitations update by owner or inviter" ON public.invitations
      FOR UPDATE USING (
        inviter_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.stores s WHERE s.id = invitations.store_id AND s.owner_id = auth.uid()
        )
      ) WITH CHECK (
        inviter_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.stores s WHERE s.id = invitations.store_id AND s.owner_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invitations' AND policyname = 'Invitations delete by owner'
  ) THEN
    CREATE POLICY "Invitations delete by owner" ON public.invitations
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.stores s WHERE s.id = invitations.store_id AND s.owner_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- 9) Redeem invitation function (enforces expiry and usage limits)
CREATE OR REPLACE FUNCTION public.redeem_invitation(invite_code uuid)
RETURNS TABLE (store_id uuid, role public.user_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.invitations;
BEGIN
  SELECT * INTO v_inv
  FROM public.invitations
  WHERE code = invite_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_inv.expires_at <= now() THEN
    RAISE EXCEPTION 'Invitation expired';
  END IF;

  IF v_inv.uses >= v_inv.max_uses THEN
    RAISE EXCEPTION 'Invitation usage limit reached';
  END IF;

  UPDATE public.invitations
  SET uses = uses + 1,
      used_by = COALESCE(used_by, auth.uid()),
      used_at = COALESCE(used_at, now()),
      updated_at = now()
  WHERE id = v_inv.id;

  RETURN QUERY SELECT v_inv.store_id, v_inv.role;
END;
$$;

-- Allow authenticated users to execute redeem_invitation
DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION public.redeem_invitation(uuid) TO authenticated;
EXCEPTION WHEN undefined_object THEN
  -- role may not exist in non-Supabase local environments; ignore
  NULL;
END
$$;

COMMIT;


