#!/usr/bin/env node
/**
 * Run database migration for hierarchy tracking
 * This script applies the migration using the Supabase service role
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jivccjpzcecljzuzxxhx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Starting hierarchy tracking migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20251003100000_add_hierarchy_tracking.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('🔧 Applying migration...\n');

    // Split the SQL into individual statements (simple split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comment-only statements
      if (statement.trim().startsWith('COMMENT ON')) {
        console.log(`⏭️  Skipping comment statement ${i + 1}/${statements.length}`);
        continue;
      }

      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Some errors are OK (e.g., column already exists)
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1}: Already exists (skipped)`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1}: Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total statements: ${statements.length}`);

    if (errorCount === 0) {
      console.log('\n✨ Migration completed successfully!');
      return true;
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please review.');
      return false;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

// Alternative: Run migration using direct SQL execution
async function runMigrationDirect() {
  console.log('🚀 Running migration using direct SQL execution...\n');

  try {
    const migrationPath = join(__dirname, '../supabase/migrations/20251003100000_add_hierarchy_tracking.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute individual ALTER TABLE statements
    const alterStatements = [
      // Add columns to jobs
      `ALTER TABLE IF EXISTS public.jobs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL`,

      // Add columns to candidates
      `ALTER TABLE IF EXISTS public.candidates ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL`,

      // Add columns to applications
      `ALTER TABLE IF EXISTS public.applications ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL`,
      `ALTER TABLE IF EXISTS public.applications ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL`,

      // Add columns to users
      `ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS phone text`,
      `ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS reports_to uuid REFERENCES public.users(id) ON DELETE SET NULL`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by)`,
      `CREATE INDEX IF NOT EXISTS idx_candidates_created_by ON public.candidates(created_by)`,
      `CREATE INDEX IF NOT EXISTS idx_applications_assigned_to ON public.applications(assigned_to)`,
      `CREATE INDEX IF NOT EXISTS idx_applications_created_by ON public.applications(created_by)`,
      `CREATE INDEX IF NOT EXISTS idx_users_reports_to ON public.users(reports_to)`,
    ];

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < alterStatements.length; i++) {
      const statement = alterStatements[i];
      console.log(`⚙️  Executing ${i + 1}/${alterStatements.length}: ${statement.substring(0, 60)}...`);

      try {
        // Use the REST API to execute SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({ query: statement })
        });

        if (response.ok) {
          console.log(`✅ Statement ${i + 1}: Success`);
          successCount++;
        } else {
          const error = await response.text();
          if (error.includes('already exists') || error.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1}: Already exists (skipped)`);
            successCount++;
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error);
            errorCount++;
          }
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    return errorCount === 0;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

// Run the migration
runMigrationDirect()
  .then(success => {
    if (success) {
      console.log('\n🎉 All done! Your database is ready for hierarchy-based filtering.');
      console.log('\n📝 Next steps:');
      console.log('   1. Set up reports_to relationships in Team Management');
      console.log('   2. Assign roles to all users');
      console.log('   3. Test hierarchy filtering with different roles\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Please check the errors above and try again.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  });
