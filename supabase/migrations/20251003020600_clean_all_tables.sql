-- Clean all data from tables while preserving structure
-- This will delete all rows but keep the table schemas intact

-- Disable triggers temporarily to avoid audit log entries during cleanup
SET session_replication_role = 'replica';

-- Truncate all tables in dependency order (children first, then parents)
-- Using CASCADE will automatically truncate dependent tables

-- Clean application-related data
TRUNCATE TABLE application_question_responses CASCADE;
TRUNCATE TABLE application_files CASCADE;
TRUNCATE TABLE application_stage_history CASCADE;
TRUNCATE TABLE applications CASCADE;

-- Clean interview-related data
TRUNCATE TABLE interview_participants CASCADE;
TRUNCATE TABLE interviews CASCADE;

-- Clean job-related data
TRUNCATE TABLE job_application_questions CASCADE;
TRUNCATE TABLE job_assigned_recruiters CASCADE;
TRUNCATE TABLE jobs CASCADE;

-- Clean candidate-related data
TRUNCATE TABLE candidate_education CASCADE;
TRUNCATE TABLE candidate_experiences CASCADE;
TRUNCATE TABLE candidate_files CASCADE;
TRUNCATE TABLE candidate_tags CASCADE;
TRUNCATE TABLE candidates CASCADE;

-- Clean client and contact data
TRUNCATE TABLE contact_client_assignments CASCADE;
TRUNCATE TABLE internal_spocs CASCADE;
TRUNCATE TABLE external_spocs CASCADE;
TRUNCATE TABLE contacts CASCADE;
TRUNCATE TABLE clients CASCADE;

-- Clean organizational data
TRUNCATE TABLE team_invitations CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE roles CASCADE;

-- Clean configuration data
TRUNCATE TABLE custom_stages CASCADE;
TRUNCATE TABLE stages CASCADE;
TRUNCATE TABLE tags CASCADE;

-- Clean audit logs
TRUNCATE TABLE audit_logs CASCADE;

-- Clean company data (this will cascade to all related tables due to foreign keys)
TRUNCATE TABLE companies CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Database cleanup completed successfully. All tables have been truncated while preserving their structure.';
END $$;
