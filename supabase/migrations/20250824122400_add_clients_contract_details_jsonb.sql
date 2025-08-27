-- Ensure clients table has contract_details JSONB for storing all contract terms
ALTER TABLE IF EXISTS public.clients
  ADD COLUMN IF NOT EXISTS contract_details jsonb DEFAULT '{}'::jsonb;

-- Optional: backfill JSON from legacy flat columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'contract_type'
  ) THEN
    UPDATE public.clients c
    SET contract_details = coalesce(c.contract_details, '{}'::jsonb) ||
      jsonb_strip_nulls(jsonb_build_object(
        'contractType', c.contract_type,
        'paymentTerms', c.payment_terms,
        'startDate', CASE WHEN c.contract_start_date IS NOT NULL THEN to_char(c.contract_start_date, 'YYYY-MM-DD') ELSE NULL END,
        'endDate', CASE WHEN c.contract_end_date IS NOT NULL THEN to_char(c.contract_end_date, 'YYYY-MM-DD') ELSE NULL END
      ))
    WHERE c.contract_details IS NULL OR c.contract_details = '{}'::jsonb;
  END IF;
END $$;

-- Optional: GIN index for JSONB queries on contract_details
CREATE INDEX IF NOT EXISTS idx_clients_contract_details_gin
  ON public.clients
  USING GIN (contract_details);

-- Notes:
-- - This migration aligns the schema with the application logic which stores
--   all contract terms inside clients.contract_details (JSONB).
-- - If you have an older migration that attempts to ALTER a non-existent
--   public.contract_details table, remove it before applying this migration.
