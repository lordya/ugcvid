'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Update user profile (display_name and avatar_url)
 */
export async function updateProfile(data: {
  display_name?: string
  avatar_url?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const updateData: { display_name?: string | null; avatar_url?: string | null } = {}
    if (data.display_name !== undefined) {
      updateData.display_name = data.display_name.trim() || null
    }
    if (data.avatar_url !== undefined) {
      updateData.avatar_url = data.avatar_url || null
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in updateProfile:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update user preferences
 */
export async function updatePreferences(preferences: {
  email_notifications?: boolean
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current preferences and merge
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching user preferences:', fetchError)
      return { success: false, error: fetchError.message }
    }

    const currentPreferences = (userData?.preferences as Record<string, any>) || {}
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
    }

    const { error } = await supabase
      .from('users')
      .update({ preferences: updatedPreferences })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating preferences:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in updatePreferences:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user transactions
 */
export async function getUserTransactions(): Promise<{
  transactions: Array<{
    id: string
    amount: number
    type: string
    provider: string
    created_at: string
    payment_id: string | null
  }>
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { transactions: [], error: 'Unauthorized' }
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, amount, type, provider, created_at, payment_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching transactions:', error)
      return { transactions: [], error: error.message }
    }

    return { transactions: transactions || [] }
  } catch (error) {
    console.error('Error in getUserTransactions:', error)
    return { transactions: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Upload avatar image to Supabase Storage
 * Returns the public URL of the uploaded file
 */
export async function uploadAvatar(formData: FormData): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 5MB' }
    }

    // Generate unique filename
    // Path structure: avatars/{user_id}/{timestamp}.{ext}
    // This matches the RLS policy which expects the first folder to be the user_id
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `avatars/${user.id}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath)

    // Delete old avatar if exists
    const { data: userData } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (userData?.avatar_url) {
      // Extract path from URL (remove domain and query params)
      // Handles both old format: avatars/{user_id}-{timestamp}.{ext}
      // and new format: avatars/{user_id}/{timestamp}.{ext}
      const urlParts = userData.avatar_url.split('/avatars/')
      if (urlParts.length > 1) {
        // Get the path after '/avatars/' and remove any query params or fragments
        const oldPath = urlParts[1].split('?')[0].split('#')[0]
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath])
        }
      }
    }

    // Update user's avatar_url
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating avatar_url:', updateError)
      // Try to clean up uploaded file
      await supabase.storage.from('avatars').remove([filePath])
      return { success: false, error: updateError.message }
    }

    revalidatePath('/settings')
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Error in uploadAvatar:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

