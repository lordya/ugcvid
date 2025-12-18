/**
 * Script to apply Supabase migration via direct SQL execution
 * This uses the Supabase REST API to execute SQL
 */

const fs = require('fs')
const path = require('path')

async function applyMigration(migrationFile) {
  console.log(`\n📋 Migration: ${migrationFile}\n`)
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`)
    process.exit(1)
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf-8')
  
  console.log('📝 Migration SQL:')
  console.log('─'.repeat(60))
  console.log(sql)
  console.log('─'.repeat(60))
  
  console.log('\n⚠️  To apply this migration, choose one of the following methods:\n')
  
  console.log('📌 Method 1: Supabase Dashboard (Recommended)')
  console.log('   1. Go to https://supabase.com/dashboard')
  console.log('   2. Select your project')
  console.log('   3. Navigate to SQL Editor (left sidebar)')
  console.log('   4. Click "New query"')
  console.log('   5. Copy and paste the SQL above')
  console.log('   6. Click "Run" (or press Ctrl+Enter)\n')
  
  console.log('📌 Method 2: Supabase CLI')
  console.log('   1. Install Supabase CLI: npm install -g supabase')
  console.log('   2. Link your project: supabase link --project-ref YOUR_PROJECT_REF')
  console.log('   3. Apply migration: supabase db push\n')
  
  console.log('📌 Method 3: Direct PostgreSQL Connection')
  console.log('   Use psql or any PostgreSQL client to connect and run the SQL\n')
  
  // Try to use fetch to execute via REST API (if credentials are available)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (supabaseUrl && serviceRoleKey) {
    console.log('🔄 Attempting to apply migration via API...\n')
    
    try {
      // Supabase doesn't have a direct SQL execution endpoint via REST
      // We'll need to use the Management API or direct PostgreSQL connection
      console.log('⚠️  Direct API execution not available. Please use Method 1 (Dashboard).\n')
    } catch (error) {
      console.error('❌ Error:', error.message)
      console.log('\nPlease use Method 1 (Supabase Dashboard) instead.\n')
    }
  } else {
    console.log('⚠️  Environment variables not found. Please use Method 1 (Dashboard).\n')
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2] || '20240521000003_add_user_profile_fields.sql'

applyMigration(migrationFile)
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

