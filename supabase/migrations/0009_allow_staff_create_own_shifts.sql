-- Allow staff to create their own shifts (idempotent)
-- This complements existing manager-only insert policy

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shifts'
      AND policyname = 'Shifts insert by staff (self)'
  ) THEN
    CREATE POLICY "Shifts insert by staff (self)" ON public.shifts
      FOR INSERT
      WITH CHECK (
        public.is_store_member(auth.uid(), store_id)
        AND (user_id = auth.uid())
      );
  END IF;
END
$$;

COMMIT;


