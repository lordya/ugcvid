/**
 * Video Storage Service
 * Handles downloading videos from Kie.ai and storing them in Supabase Storage
 */

import { createAdminClient } from '@/lib/supabase/admin'

const VIDEOS_BUCKET = 'videos'

/**
 * Downloads a video from Kie.ai URL and uploads it to Supabase Storage
 * @param kieVideoUrl - The video URL from Kie.ai
 * @param userId - The user ID who owns the video
 * @param videoId - The video ID in the database
 * @returns The storage path if successful, null if failed
 */
export async function storeVideoFromKie(
  kieVideoUrl: string,
  userId: string,
  videoId: string
): Promise<string | null> {
  try {
    const adminClient = createAdminClient()

    // 1. Download video from Kie.ai
    const videoResponse = await fetch(kieVideoUrl, {
      method: 'GET',
    })

    if (!videoResponse.ok) {
      console.error(
        `Failed to download video from Kie.ai: ${videoResponse.status} ${videoResponse.statusText}`
      )
      return null
    }

    // 2. Get video as blob
    const videoBlob = await videoResponse.blob()

    // 3. Generate storage path: videos/{user_id}/{video_id}.mp4
    const storagePath = `videos/${userId}/${videoId}.mp4`

    // 4. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from(VIDEOS_BUCKET)
      .upload(storagePath, videoBlob, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting if file already exists
        contentType: 'video/mp4',
      })

    if (uploadError) {
      console.error('Error uploading video to storage:', uploadError)
      return null
    }

    return storagePath
  } catch (error) {
    console.error('Error storing video from Kie.ai:', error)
    return null
  }
}

/**
 * Deletes a video from Supabase Storage
 * @param storagePath - The storage path (e.g., videos/{user_id}/{video_id}.mp4)
 * @returns true if successful, false otherwise
 */
export async function deleteVideoFromStorage(storagePath: string): Promise<boolean> {
  try {
    if (!storagePath) {
      return false
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient.storage.from(VIDEOS_BUCKET).remove([storagePath])

    if (error) {
      console.error('Error deleting video from storage:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting video from storage:', error)
    return false
  }
}

/**
 * Generates a signed URL for a video in Supabase Storage
 * @param storagePath - The storage path (e.g., videos/{user_id}/{video_id}.mp4)
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns The signed URL if successful, null if failed
 */
export async function getSignedVideoUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    if (!storagePath) {
      return null
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient.storage
      .from(VIDEOS_BUCKET)
      .createSignedUrl(storagePath, expiresIn)

    if (error) {
      console.error('Error generating signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return null
  }
}

