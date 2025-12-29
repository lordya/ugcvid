import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
    const isAdmin = adminEmails.includes(user.email)

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Error checking admin access:', error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}
