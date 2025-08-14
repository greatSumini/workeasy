-- Exchange requests schema: create exchange_requests table and RLS policies
-- Idempotent migration per Supabase Migration SQL Guideline

BEGIN;

-- Ensure required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) ENUM: exchange_request_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t WHERE t.typname = 'exchange_request_status'
  ) THEN
    CREATE TYPE public.exchange_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
  END IF;
END
$$;

-- 2) exchange_requests table
CREATE TABLE IF NOT EXISTS public.exchange_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  target_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  status public.exchange_request_status NOT NULL DEFAULT 'pending',
  approved_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT chk_exchange_requester_not_target CHECK (requester_id != target_user_id),
  CONSTRAINT chk_approved_fields CHECK (
    (status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR
    (status != 'approved' AND (approved_by IS NULL OR approved_at IS NULL))
  )
);

-- trigger for exchange_requests.updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'exchange_requests_set_timestamp'
  ) THEN
    CREATE TRIGGER exchange_requests_set_timestamp
    BEFORE UPDATE ON public.exchange_requests
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END
$$;

-- 3) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_requests_store_status ON public.exchange_requests (store_id, status);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_requester ON public.exchange_requests (requester_id, status);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_target ON public.exchange_requests (target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_shift ON public.exchange_requests (shift_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_created ON public.exchange_requests (created_at DESC);

-- 4) RLS enable
ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies (idempotent)

-- Select: store members can view requests related to their store
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exchange_requests' AND policyname = 'Exchange requests select for store members'
  ) THEN
    CREATE POLICY "Exchange requests select for store members" ON public.exchange_requests
      FOR SELECT USING (
        public.is_store_member(auth.uid(), store_id) OR 
        public.is_store_owner(auth.uid(), store_id) OR
        public.is_store_manager(auth.uid(), store_id)
      );
  END IF;
END
$$;

-- Insert: store members can create requests for their own shifts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exchange_requests' AND policyname = 'Exchange requests insert by requester'
  ) THEN
    CREATE POLICY "Exchange requests insert by requester" ON public.exchange_requests
      FOR INSERT WITH CHECK (
        requester_id = auth.uid() AND
        public.is_store_member(auth.uid(), store_id)
      );
  END IF;
END
$$;

-- Update: requesters can cancel their own requests, managers can approve/reject
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exchange_requests' AND policyname = 'Exchange requests update'
  ) THEN
    CREATE POLICY "Exchange requests update" ON public.exchange_requests
      FOR UPDATE USING (
        (requester_id = auth.uid() AND status = 'pending') OR
        public.is_store_manager(auth.uid(), store_id)
      ) WITH CHECK (
        (requester_id = auth.uid() AND status IN ('pending', 'cancelled')) OR
        public.is_store_manager(auth.uid(), store_id)
      );
  END IF;
END
$$;

-- Delete: requesters can delete their own pending requests, managers can delete any
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exchange_requests' AND policyname = 'Exchange requests delete'
  ) THEN
    CREATE POLICY "Exchange requests delete" ON public.exchange_requests
      FOR DELETE USING (
        (requester_id = auth.uid() AND status = 'pending') OR
        public.is_store_manager(auth.uid(), store_id)
      );
  END IF;
END
$$;

COMMIT;
