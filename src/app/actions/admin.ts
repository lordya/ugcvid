'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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

