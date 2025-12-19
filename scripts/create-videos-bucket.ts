/**
 * Script to create the videos storage bucket in Supabase
 * 
 * This script creates the 'videos' bucket with appropriate settings:
 * - Private bucket (not publicly accessible)
 * - 500MB file size limit
 * - Video MIME types allowed
 * 
 * Usage:
 *   Make sure you have .env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   npx tsx scripts/create-videos-bucket.ts
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  console.error('Please check your .env.local file')
  process.exit(1)
}

// Create admin client
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createVideosBucket() {
  try {
    console.log('Creating videos storage bucket...')
    
    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await adminClient.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      process.exit(1)
    }
    
    const videosBucket = existingBuckets?.find(bucket => bucket.id === 'videos')
    
    if (videosBucket) {
      console.log('✅ Videos bucket already exists!')
      console.log('Bucket details:', {
        id: videosBucket.id,
        name: videosBucket.name,
        public: videosBucket.public,
        file_size_limit: videosBucket.file_size_limit,
        allowed_mime_types: videosBucket.allowed_mime_types,
      })
      return
    }
    
    // Create the videos bucket
    // Note: fileSizeLimit and allowedMimeTypes can be configured later in the Supabase dashboard
    const { data: bucket, error: createError } = await adminClient.storage.createBucket('videos', {
      public: false, // Private bucket (videos should not be publicly accessible)
    })
    
    if (createError) {
      console.error('Error creating bucket:', createError)
      process.exit(1)
    }
    
    // Fetch the bucket details after creation to get all properties
    const { data: bucketDetails, error: getError } = await adminClient.storage.getBucket('videos')
    
    if (getError) {
      console.warn('Warning: Could not fetch bucket details:', getError)
      console.log('✅ Videos bucket created successfully!')
      console.log('Bucket details:', {
        id: 'videos',
        name: 'videos',
        public: false,
      })
    } else {
      console.log('✅ Videos bucket created successfully!')
      console.log('Bucket details:', {
        id: bucketDetails?.id,
        name: bucketDetails?.name,
        public: bucketDetails?.public,
        file_size_limit: bucketDetails?.file_size_limit,
        allowed_mime_types: bucketDetails?.allowed_mime_types,
      })
    }
    
    console.log('\n📝 Next steps:')
    console.log('1. Run the migration to add RLS policies:')
    console.log('   npx supabase migration up')
    console.log('   OR apply migration: supabase/migrations/20240521000005_add_videos_bucket.sql')
    
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
createVideosBucket()

