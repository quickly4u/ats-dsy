-- Add new columns to contract_details table
DO $$
BEGIN
  -- Deprecated migration: this referenced a non-existent table in our schema.
  -- Keep it guarded so applying historical migrations doesn't fail.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'contract_details'
  ) THEN
    ALTER TABLE public.contract_details
      ADD COLUMN IF NOT EXISTS is_exclusive boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS includes_background_check boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS has_replacement_guarantee boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS replacement_guarantee_days integer,
      ADD COLUMN IF NOT EXISTS has_confidentiality_agreement boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS additional_terms text;

    COMMENT ON COLUMN public.contract_details.is_exclusive IS 'Whether the contract includes an exclusive recruitment agreement';
    COMMENT ON COLUMN public.contract_details.includes_background_check IS 'Whether background check services are included';
    COMMENT ON COLUMN public.contract_details.has_replacement_guarantee IS 'Whether there is a replacement guarantee';
    COMMENT ON COLUMN public.contract_details.replacement_guarantee_days IS 'Number of days for the replacement guarantee';
    COMMENT ON COLUMN public.contract_details.has_confidentiality_agreement IS 'Whether a confidentiality agreement is in place';
    COMMENT ON COLUMN public.contract_details.additional_terms IS 'Any additional terms and conditions';
  END IF;
END $$;

-- Note: Our application uses clients.contract_details (JSONB). See
-- migration 20250824122400_add_clients_contract_details_jsonb.sql
