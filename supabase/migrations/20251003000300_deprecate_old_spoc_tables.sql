-- Deprecate old SPOC tables in favor of the new structure
-- The new structure uses external_spocs, internal_spocs, and internal_spoc_clients
-- The old structure used spocs and client_spocs which are now deprecated

-- Add deprecation comments to old tables
COMMENT ON TABLE public.spocs IS 'DEPRECATED: Use external_spocs and internal_spocs instead. This table will be removed in a future migration.';
COMMENT ON TABLE public.client_spocs IS 'DEPRECATED: Use external_spocs and internal_spoc_clients instead. This table will be removed in a future migration.';

-- Migration helper: If you have data in old tables, migrate it with this function
CREATE OR REPLACE FUNCTION migrate_old_spoc_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a placeholder for data migration
  -- Implement based on your old table schema if needed

  RAISE NOTICE 'SPOC data migration complete. Review and remove old tables when ready.';
END;
$$;

-- To execute the migration (run manually when ready):
-- SELECT migrate_old_spoc_data();

-- Recommended: After migrating data, drop old tables with:
-- DROP TABLE IF EXISTS public.client_spocs CASCADE;
-- DROP TABLE IF EXISTS public.spocs CASCADE;
