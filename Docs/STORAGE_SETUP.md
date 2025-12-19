# Storage Setup Guide

This guide documents the process for setting up Supabase Storage buckets for the AFP UGC platform.

## Overview

The platform uses Supabase Storage for:
- **Avatars**: User profile pictures stored in the `avatars` bucket
- **Videos** (Optional): Generated video files if Kie.ai URLs are temporary

## Avatars Bucket Setup

### Step 1: Create the Bucket

1. Navigate to your Supabase project dashboard
2. Go to **Storage** section in the left sidebar
3. Click **"New bucket"** button
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: Toggle ON (or OFF if using RLS policies)
   - **File size limit**: 5MB (recommended)
   - **Allowed MIME types**: `image/*` (optional, for validation)
5. Click **"Create bucket"**

### Step 2: Apply RLS Policies

After creating the bucket, run the migration file to set up RLS policies:

```bash
# Apply the migration
npx supabase migration up
```

Or manually run the SQL from `supabase/migrations/20240521000004_add_storage_rls_policies.sql` in the Supabase SQL Editor.

### Step 3: Verify Policies

The following policies should be created:

- **INSERT**: Users can upload to `avatars/{user_id}/*`
- **SELECT**: Users can view all avatars (for profile displays)
- **UPDATE**: Users can only update their own avatars
- **DELETE**: Users can only delete their own avatars

### File Path Convention

Avatar files should be uploaded with the following path structure:
```
avatars/{user_id}/{timestamp}.{extension}
```

Example: `avatars/123e4567-e89b-12d3-a456-426614174000/1699123456789.jpg`

## Videos Bucket Setup

### Step 1: Create the Bucket

The `videos` bucket stores generated video files. You can create it in two ways:

**Option A: Using the Script (Recommended)**
```bash
# Make sure you have .env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npx tsx scripts/create-videos-bucket.ts
```

**Option B: Manual Creation**
1. Navigate to your Supabase project dashboard
2. Go to **Storage** section in the left sidebar
3. Click **"New bucket"** button
4. Configure the bucket:
   - **Name**: `videos`
   - **Public bucket**: Toggle OFF (videos should be private)
   - **File size limit**: 100MB+ (adjust based on your plan)
   - **Allowed MIME types**: `video/mp4`, `video/webm`, `video/quicktime` (optional)
5. Click **"Create bucket"**

### Step 2: Apply RLS Policies

After creating the bucket, run the migration file to set up RLS policies:

```bash
# Apply the migration
npx supabase migration up
```

Or manually run the SQL from `supabase/migrations/20240521000005_add_videos_bucket.sql` in the Supabase SQL Editor.

### Step 3: Verify Policies

The following policies should be created:

- **INSERT**: Users can upload to `videos/{user_id}/*`
- **SELECT**: Users can only view their own videos (private)
- **UPDATE**: Users can only update their own videos
- **DELETE**: Users can only delete their own videos

### File Path Convention

Video files should be uploaded with the following path structure:
```
videos/{user_id}/{video_id}.mp4
```

Example: `videos/123e4567-e89b-12d3-a456-426614174000/abc123-def456-ghi789.mp4`

### Integration Notes

When implementing video storage:
1. Update `src/app/api/generate/video/route.ts` to download from Kie.ai and upload to bucket
2. Update `src/app/api/download/[id]/route.ts` to serve from bucket instead of Kie.ai URL
3. Update `video_url` in the database to point to the Supabase Storage path

## RLS Policy Details

### INSERT Policy

Allows authenticated users to upload files to their own folder:

```sql
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### SELECT Policy

Allows authenticated users to read all avatars (for displaying user profiles):

```sql
CREATE POLICY "Users can view all avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');
```

### UPDATE Policy

Allows users to only modify their own files:

```sql
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### DELETE Policy

Allows users to only delete their own files:

```sql
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Troubleshooting

### Issue: "Permission denied" when uploading

**Solution**: 
- Verify RLS policies are applied
- Check that the file path starts with `avatars/{user_id}/`
- Ensure user is authenticated

### Issue: Can't view avatars

**Solution**:
- If bucket is private, ensure SELECT policy is applied
- If bucket is public, check that public access is enabled
- Verify the file path in the database matches the actual file path

### Issue: Old avatar not deleted

**Solution**:
- Check that DELETE policy is applied
- Verify the old avatar path in the database
- Ensure the path extraction logic in `src/app/actions/settings.ts` is correct

## Testing

After setup, test the following:

1. **Upload**: Upload an avatar via the settings page
2. **View**: Verify the avatar appears in the bucket
3. **Access**: Check that the public URL works
4. **Update**: Upload a new avatar and verify the old one is deleted
5. **Security**: Try to access another user's avatar folder (should fail)

## Production Checklist

- [ ] `avatars` bucket created in production Supabase
- [ ] RLS policies applied via migration
- [ ] Test avatar upload in production
- [ ] Verify file size limits are appropriate
- [ ] Monitor storage usage
- [ ] Set up backup strategy if needed

