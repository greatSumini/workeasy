-- Shifts schema: create shifts table, indexes, and RLS policies
-- Idempotent migration per Supabase Migration SQL Guideline

BEGIN;

-- Ensure required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) ENUM: shift_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t WHERE t.typname = 'shift_status'
  ) THEN
    CREATE TYPE public.shift_status AS ENUM ('pending', 'confirmed');
  END IF;
END
$$;

-- 2) shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  position text,
  status public.shift_status NOT NULL DEFAULT 'pending',
  notes text,
  -- For future exchange features
  original_shift_id uuid NULL REFERENCES public.shifts(id) ON DELETE SET NULL,
  replacement_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_shift_time_valid CHECK (end_time > start_time)
);

-- trigger for shifts.updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'shifts_set_timestamp'
  ) THEN
    CREATE TRIGGER shifts_set_timestamp
    BEFORE UPDATE ON public.shifts
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END
$$;

-- 3) Indexes for scheduler performance
CREATE INDEX IF NOT EXISTS idx_shifts_store_start ON public.shifts (store_id, start_time);
CREATE INDEX IF NOT EXISTS idx_shifts_user_start ON public.shifts (user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_shifts_store_status_start ON public.shifts (store_id, status, start_time);

-- 4) RLS enable
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Helper: is_store_manager (owner or store_users.role = 'manager')
CREATE OR REPLACE FUNCTION public.is_store_manager(p_user uuid, p_store uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    EXISTS (
      SELECT 1 FROM public.store_users su
      WHERE su.store_id = p_store AND su.user_id = p_user AND su.role = 'manager'::public.user_role
    )
  ) OR public.is_store_owner(p_user, p_store);
$$;

DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION public.is_store_manager(uuid, uuid) TO authenticated;
EXCEPTION WHEN undefined_object THEN
  NULL;
END
$$;

-- 5) RLS Policies (idempotent)

-- Select: store members (including managers/owner) can view
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Shifts select for store members'
  ) THEN
    CREATE POLICY "Shifts select for store members" ON public.shifts
      FOR SELECT USING (
        public.is_store_member(auth.uid(), store_id) OR public.is_store_owner(auth.uid(), store_id)
      );
  END IF;
END
$$;

-- Insert: only store managers (including owner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Shifts insert by managers'
  ) THEN
    CREATE POLICY "Shifts insert by managers" ON public.shifts
      FOR INSERT WITH CHECK (
        public.is_store_manager(auth.uid(), store_id)
      );
  END IF;
END
$$;

-- Update: only store managers (including owner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Shifts update by managers'
  ) THEN
    CREATE POLICY "Shifts update by managers" ON public.shifts
      FOR UPDATE USING (
        public.is_store_manager(auth.uid(), store_id)
      ) WITH CHECK (
        public.is_store_manager(auth.uid(), store_id)
      );
  END IF;
END
$$;

-- Delete: only store managers (including owner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Shifts delete by managers'
  ) THEN
    CREATE POLICY "Shifts delete by managers" ON public.shifts
      FOR DELETE USING (
        public.is_store_manager(auth.uid(), store_id)
      );
  END IF;
END
$$;

COMMIT;



