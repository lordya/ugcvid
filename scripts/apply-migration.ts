/**
 * Script to apply Supabase migrations
 * Usage: npx tsx scripts/apply-migration.ts [migration-file]
 */

import { createAdminClient } from '../src/lib/supabase/admin'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyMigration(migrationFile: string) {
  console.log(`Applying migration: ${migrationFile}`)
  
  const adminClient = createAdminClient()
  
  // Read the migration file
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', migrationFile)
  const sql = readFileSync(migrationPath, 'utf-8')
  
  // Split by semicolons to execute statements separately
  // This is a simple approach - for production, consider using a proper SQL parser
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  try {
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`)
        // @ts-expect-error - exec_sql is a dynamic RPC function that may not be in types
        const { error } = await adminClient.rpc('exec_sql' as any, { sql_query: statement })
        
        // If RPC doesn't work, try direct query (this requires raw SQL execution)
        // For now, we'll use a workaround: execute via REST API or use Supabase Dashboard
        if (error) {
          console.error('Error executing statement:', error)
          console.log('\n⚠️  Direct SQL execution via admin client is limited.')
          console.log('Please apply this migration manually via Supabase Dashboard:')
          console.log(`\n1. Go to your Supabase Dashboard`)
          console.log(`2. Navigate to SQL Editor`)
          console.log(`3. Copy and paste the contents of: ${migrationPath}`)
          console.log(`4. Click "Run" to execute the migration\n`)
          return
        }
      }
    }
    
    console.log('✅ Migration applied successfully!')
  } catch (error) {
    console.error('Error applying migration:', error)
    console.log('\n⚠️  Please apply this migration manually via Supabase Dashboard:')
    console.log(`\n1. Go to your Supabase Dashboard`)
    console.log(`2. Navigate to SQL Editor`)
    console.log(`3. Copy and paste the contents of: ${migrationPath}`)
    console.log(`4. Click "Run" to execute the migration\n`)
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2] || '20240521000003_add_user_profile_fields.sql'

applyMigration(migrationFile)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

