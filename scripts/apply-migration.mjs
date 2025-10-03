#!/usr/bin/env node
/**
 * Apply hierarchy tracking migration to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSQL(sql) {
  // Use the SQL editor endpoint directly
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ sql })
  });

  return response;
}

async function applyMigration() {
  console.log('🚀 Applying hierarchy tracking migration\n');
  console.log('📍 Database:', SUPABASE_URL);
  console.log('');

  const migrations = [
    {
      name: 'Add created_by to jobs',
      sql: `ALTER TABLE IF EXISTS public.jobs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;`
    },
    {
      name: 'Add created_by to candidates',
      sql: `ALTER TABLE IF EXISTS public.candidates ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;`
    },
    {
      name: 'Add assigned_to to applications',
      sql: `ALTER TABLE IF EXISTS public.applications ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL;`
    },
    {
      name: 'Add created_by to applications',
      sql: `ALTER TABLE IF EXISTS public.applications ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;`
    },
    {
      name: 'Add phone to users',
      sql: `ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS phone text;`
    },
    {
      name: 'Add reports_to to users',
      sql: `ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS reports_to uuid REFERENCES public.users(id) ON DELETE SET NULL;`
    },
    {
      name: 'Index: jobs.created_by',
      sql: `CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);`
    },
    {
      name: 'Index: candidates.created_by',
      sql: `CREATE INDEX IF NOT EXISTS idx_candidates_created_by ON public.candidates(created_by);`
    },
    {
      name: 'Index: applications.assigned_to',
      sql: `CREATE INDEX IF NOT EXISTS idx_applications_assigned_to ON public.applications(assigned_to);`
    },
    {
      name: 'Index: applications.created_by',
      sql: `CREATE INDEX IF NOT EXISTS idx_applications_created_by ON public.applications(created_by);`
    },
    {
      name: 'Index: users.reports_to',
      sql: `CREATE INDEX IF NOT EXISTS idx_users_reports_to ON public.users(reports_to);`
    }
  ];

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const migration of migrations) {
    process.stdout.write(`⚙️  ${migration.name}... `);

    try {
      // Try using the Supabase client's raw query method
      const { data, error } = await supabase.rpc('exec', { sql: migration.sql });

      if (error) {
        if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate'))) {
          console.log('⏭️  Already exists');
          skipCount++;
        } else {
          console.log('❌ Failed:', error.message || error);
          errorCount++;
        }
      } else {
        console.log('✅ Success');
        successCount++;
      }
    } catch (err) {
      // Fallback: The RPC might not exist, so we'll note that
      if (err.message && (err.message.includes('already exists') || err.message.includes('not found'))) {
        console.log('⚠️  Cannot verify (may already exist)');
        skipCount++;
      } else {
        console.log('❌ Error:', err.message);
        errorCount++;
      }
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⏭️  Skipped (existing): ${skipCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${migrations.length}\n`);

  if (errorCount === 0) {
    console.log('✨ Migration completed!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Run: node scripts/backfill-data.mjs');
    console.log('   2. Set up reports_to in Team Management UI');
    console.log('   3. Test with different user roles\n');
    return true;
  } else {
    console.log('⚠️  Some migrations failed. You may need to run them manually in Supabase SQL Editor.\n');
    console.log('📄 Migration file: supabase/migrations/20251003100000_add_hierarchy_tracking.sql\n');
    return false;
  }
}

applyMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });