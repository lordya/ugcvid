import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'
import { getUserIntegrations } from '@/app/actions/settings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('display_name, avatar_url, preferences, credits_balance')
    .eq('id', user.id)
    .single()

  if (userError) {
    console.error('Error fetching user data:', userError)
  }

  // Fetch user integrations
  const { integrations: userIntegrations } = await getUserIntegrations()

  const preferences = (userData?.preferences as Record<string, any>) || {}
  const emailNotifications = preferences.email_notifications ?? true

  return (
    <SettingsClient
      initialDisplayName={userData?.display_name || ''}
      initialAvatarUrl={userData?.avatar_url || ''}
      initialEmailNotifications={emailNotifications}
      initialCreditsBalance={userData?.credits_balance || 0}
      userEmail={user.email || ''}
      initialIntegrations={userIntegrations}
    />
  )
}

