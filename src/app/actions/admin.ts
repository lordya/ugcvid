'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Json } from '@/types/supabase'

/**
 * Check if the current user is an admin based on ADMIN_EMAILS env variable
 */
async function checkAdminAccess(): Promise<{ isAdmin: boolean; email: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { isAdmin: false, email: null }
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
  const isAdmin = adminEmails.includes(user.email)

  return { isAdmin, email: user.email }
}

const adjustCreditsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().int('Amount must be an integer'),
  reason: z.string().min(1, 'Reason is required'),
})

export interface AdminUser {
  id: string
  email: string
  credits_balance: number
  created_at: string
  role: string
}

/**
 * Get all users for admin view
 * Uses service role key to bypass RLS
 */
export async function getAdminUsers(): Promise<{ users: AdminUser[]; error?: string }> {
  const { isAdmin } = await checkAdminAccess()

  if (!isAdmin) {
    return { users: [], error: 'Unauthorized: Admin access required' }
  }

  try {
    const adminClient = createAdminClient()

    const { data: users, error } = await adminClient
      .from('users')
      .select('id, email, credits_balance, created_at, role')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching admin users:', error)
      return { users: [], error: error.message }
    }

    return { users: users || [] }
  } catch (error) {
    console.error('Error in getAdminUsers:', error)
    return { users: [], error: 'Failed to fetch users' }
  }
}

/**
 * Adjust user credits (add or remove)
 * Creates a transaction record and updates user balance
 */
export async function adjustUserCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { isAdmin } = await checkAdminAccess()

  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin access required' }
  }

  // Validate input
  const validatedData = adjustCreditsSchema.safeParse({ userId, amount, reason })
  if (!validatedData.success) {
    const firstError = validatedData.error.issues[0]
    return { success: false, error: firstError?.message || 'Validation failed' }
  }

  try {
    const adminClient = createAdminClient()

    // Determine transaction type: BONUS for positive, REFUND for negative
    const transactionType = amount > 0 ? 'BONUS' : 'REFUND'

    // Insert transaction record
    // The database trigger will automatically update the user's credits_balance
    const { error: transactionError } = await adminClient.from('transactions').insert({
      user_id: userId,
      amount: amount, // Can be positive (BONUS) or negative (REFUND/correction)
      type: transactionType,
      provider: 'SYSTEM',
      payment_id: null, // Manual adjustments don't have payment IDs
    })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return { success: false, error: 'Failed to create transaction record' }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error in adjustUserCredits:', error)
    return { success: false, error: 'Failed to adjust credits' }
  }
}

export interface ModerationVideo {
  id: string
  user_id: string
  user_email: string
  status: string
  video_url: string | null
  final_script: string | null
  input_metadata: Json | null
  created_at: string
}

/**
 * Get moderation feed - all COMPLETED videos with user emails
 * Uses service role key to bypass RLS
 */
export async function getModerationFeed(): Promise<{ videos: ModerationVideo[]; error?: string }> {
  const { isAdmin } = await checkAdminAccess()

  if (!isAdmin) {
    return { videos: [], error: 'Unauthorized: Admin access required' }
  }

  try {
    const adminClient = createAdminClient()

    // Fetch COMPLETED videos
    const { data: videos, error } = await adminClient
      .from('videos')
      .select('id, user_id, status, video_url, final_script, input_metadata, created_at')
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching moderation feed:', error)
      return { videos: [], error: error.message }
    }

    if (!videos || videos.length === 0) {
      return { videos: [] }
    }

    // Fetch user emails for all unique user_ids
    const userIds = [...new Set(videos.map((v) => v.user_id))]
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('id, email')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching user emails:', usersError)
      // Continue with videos but mark emails as unknown
    }

    // Create a map of user_id -> email
    const userEmailMap = new Map<string, string>()
    users?.forEach((user) => {
      userEmailMap.set(user.id, user.email)
    })

    // Transform the data to include user_email
    const transformedVideos: ModerationVideo[] = videos.map((video) => ({
      id: video.id,
      user_id: video.user_id,
      user_email: userEmailMap.get(video.user_id) || 'Unknown',
      status: video.status,
      video_url: video.video_url,
      final_script: video.final_script,
      input_metadata: video.input_metadata,
      created_at: video.created_at,
    }))

    return { videos: transformedVideos }
  } catch (error) {
    console.error('Error in getModerationFeed:', error)
    return { videos: [], error: 'Failed to fetch moderation feed' }
  }
}

const deleteVideoSchema = z.object({
  videoId: z.string().uuid('Invalid video ID'),
})

/**
 * Delete a video (hard delete)
 */
export async function deleteVideo(videoId: string): Promise<{ success: boolean; error?: string }> {
  const { isAdmin } = await checkAdminAccess()

  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin access required' }
  }

  // Validate input
  const validatedData = deleteVideoSchema.safeParse({ videoId })
  if (!validatedData.success) {
    const firstError = validatedData.error.issues[0]
    return { success: false, error: firstError?.message || 'Validation failed' }
  }

  try {
    const adminClient = createAdminClient()

    // Hard delete the video
    const { error } = await adminClient.from('videos').delete().eq('id', videoId)

    if (error) {
      console.error('Error deleting video:', error)
      return { success: false, error: 'Failed to delete video' }
    }

    revalidatePath('/admin/moderation')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteVideo:', error)
    return { success: false, error: 'Failed to delete video' }
  }
}

const blockUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

/**
 * Block a user by setting banned = true
 * Note: This requires a 'banned' column in the users table
 */
export async function blockUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const { isAdmin } = await checkAdminAccess()

  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin access required' }
  }

  // Validate input
  const validatedData = blockUserSchema.safeParse({ userId })
  if (!validatedData.success) {
    const firstError = validatedData.error.issues[0]
    return { success: false, error: firstError?.message || 'Validation failed' }
  }

  try {
    const adminClient = createAdminClient()

    // Update user's banned status
    // First check if banned column exists, if not we'll use Supabase Auth admin API
    const { error } = await adminClient
      .from('users')
      .update({ banned: true })
      .eq('id', userId)

    if (error) {
      // If column doesn't exist, try using Supabase Auth admin API
      if (error.code === '42703' || error.message.includes('column') || error.message.includes('banned')) {
        // Column doesn't exist - use Supabase Auth admin API to ban user
        try {
          const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(userId)
          if (authError || !authUser.user) {
            return { success: false, error: 'User not found' }
          }

          // Ban user via Supabase Auth - set ban metadata
          // Note: Supabase Auth doesn't have a direct ban API, so we'll use user metadata
          const { error: banError } = await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: {
              banned: true,
              banned_at: new Date().toISOString(),
            },
          })

          if (banError) {
            console.error('Error banning user via Auth:', banError)
            return { success: false, error: 'Failed to ban user' }
          }

          revalidatePath('/admin/moderation')
          return { success: true }
        } catch (authErr) {
          console.error('Error in blockUser (Auth API):', authErr)
          return { success: false, error: 'Failed to ban user' }
        }
      }

      console.error('Error blocking user:', error)
      return { success: false, error: 'Failed to block user' }
    }

    revalidatePath('/admin/moderation')
    return { success: true }
  } catch (error) {
    console.error('Error in blockUser:', error)
    return { success: false, error: 'Failed to block user' }
  }
}

