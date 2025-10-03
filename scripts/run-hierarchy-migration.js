// Run hierarchy migration using Supabase client
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Running hierarchy tracking migration...\n');

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
      name: 'Create index: jobs.created_by',
      sql: `CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);`
    },
    {
      name: 'Create index: candidates.created_by',
      sql: `CREATE INDEX IF NOT EXISTS idx_candidates_created_by ON public.candidates(created_by);`
    },
    {
      name: 'Create index: applications.assigned_to',
      sql: `CREATE INDEX IF NOT EXISTS idx_applications_assigned_to ON public.applications(assigned_to);`
    },
    {
      name: 'Create index: applications.created_by',
      sql: `CREATE INDEX IF NOT EXISTS idx_applications_created_by ON public.applications(created_by);`
    },
    {
      name: 'Create index: users.reports_to',
      sql: `CREATE INDEX IF NOT EXISTS idx_users_reports_to ON public.users(reports_to);`
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    process.stdout.write(`⚙️  ${migration.name}... `);

    try {
      // Execute using direct SQL query
      const { data, error } = await supabase.rpc('exec', { query: migration.sql });

      if (error) {
        // Check if it's just because column/index already exists
        if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate'))) {
          console.log('✅ Already exists');
          successCount++;
        } else {
          console.log('❌ Error:', error.message);
          failCount++;
        }
      } else {
        console.log('✅ Success');
        successCount++;
      }
    } catch (err) {
      console.log('❌ Error:', err.message);
      failCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Success: ${successCount}/${migrations.length}`);
  console.log(`   ❌ Failed: ${failCount}/${migrations.length}`);

  if (failCount === 0) {
    console.log('\n✨ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Set up reporting structure in Team Management UI');
    console.log('2. Assign roles to all users');
    console.log('3. Test hierarchy filtering\n');
  } else {
    console.log('\n⚠️  Some migrations failed. See MIGRATION_INSTRUCTIONS.md for manual steps.\n');
  }

  return failCount === 0;
}

runMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });