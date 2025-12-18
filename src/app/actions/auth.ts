'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Validate input
  const validatedFields = signUpSchema.safeParse(rawData)
  
  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const errorMessage = Object.values(errors).flat().join(', ')
    redirect('/signup?error=' + encodeURIComponent(errorMessage))
  }

  const { error } = await supabase.auth.signUp({
    ...validatedFields.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to confirm your account')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Validate input
  const validatedFields = signInSchema.safeParse(rawData)
  
  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const errorMessage = Object.values(errors).flat().join(', ')
    redirect('/login?error=' + encodeURIComponent(errorMessage))
  }

  const { error } = await supabase.auth.signInWithPassword(validatedFields.data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/library')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  if (data?.url) {
    redirect(data.url)
  }

  // Fallback if no URL is returned
  redirect('/login?error=' + encodeURIComponent('Failed to initiate Google sign in'))
}

