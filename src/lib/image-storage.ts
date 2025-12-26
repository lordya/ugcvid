/**
 * Image Storage Service
 * Handles uploading user images to Supabase Storage for video generation
 */

import { createAdminClient } from '@/lib/supabase/admin'

const IMAGES_BUCKET = 'images'

/**
 * Uploads an image file to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user ID who owns the image
 * @param imageId - Unique identifier for the image (e.g., timestamp + random)
 * @returns The public URL if successful, null if failed
 */
export async function uploadImageToStorage(
  file: File,
  userId: string,
  imageId: string
): Promise<string | null> {
  try {
    const adminClient = createAdminClient()

    // Generate storage path: images/{user_id}/{image_id}.{extension}
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const storagePath = `images/${userId}/${imageId}.${fileExtension}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from(IMAGES_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting if file already exists
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Error uploading image to storage:', uploadError)
      return null
    }

    // Get public URL for the uploaded image
    const { data: urlData } = adminClient.storage
      .from(IMAGES_BUCKET)
      .getPublicUrl(storagePath)

    if (!urlData.publicUrl) {
      console.error('Error generating public URL for image')
      return null
    }

    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading image to storage:', error)
    return null
  }
}

/**
 * Uploads multiple image files to Supabase Storage
 * @param files - Array of image files to upload
 * @param userId - The user ID who owns the images
 * @returns Array of public URLs if successful, null if any upload failed
 */
export async function uploadMultipleImagesToStorage(
  files: File[],
  userId: string
): Promise<string[] | null> {
  try {
    const uploadedUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // Generate unique ID for each image
      const imageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`

      const url = await uploadImageToStorage(file, userId, imageId)
      if (!url) {
        console.error(`Failed to upload image ${i + 1}`)
        return null // Fail fast if any upload fails
      }

      uploadedUrls.push(url)
    }

    return uploadedUrls
  } catch (error) {
    console.error('Error uploading multiple images to storage:', error)
    return null
  }
}

/**
 * Deletes an image from Supabase Storage
 * @param storagePath - The storage path (e.g., images/{user_id}/{image_id}.jpg)
 * @returns true if successful, false otherwise
 */
export async function deleteImageFromStorage(storagePath: string): Promise<boolean> {
  try {
    if (!storagePath) {
      return false
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient.storage.from(IMAGES_BUCKET).remove([storagePath])

    if (error) {
      console.error('Error deleting image from storage:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting image from storage:', error)
    return false
  }
}
