import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: angles, error } = await supabase
      .from('script_angles')
      .select('id, label, description, keywords')
      .eq('is_active', true)
      .order('label')

    if (error) {
      console.error('Error fetching script angles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch script angles' },
        { status: 500 }
      )
    }

    return NextResponse.json(angles || [])
  } catch (error) {
    console.error('Script angles API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch script angles' },
      { status: 500 }
    )
  }
}
