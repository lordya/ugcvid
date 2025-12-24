import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { storeOAuthTokens } from '@/app/actions/settings'

// TikTok OAuth configuration
const TIKTOK_CONFIG = {
  clientId: process.env.TIKTOK_CLIENT_ID!,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/tiktok/callback`,
  authUrl: 'https://www.tiktok.com/auth/authorize/',
  tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
  userInfoUrl: 'https://open-api.tiktok.com/user/info/',
  scopes: ['video.upload', 'user.info.basic'],
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'connect') {
    // Redirect to TikTok OAuth
    const authUrl = new URL(TIKTOK_CONFIG.authUrl)
    authUrl.searchParams.set('client_key', TIKTOK_CONFIG.clientId)
    authUrl.searchParams.set('scope', TIKTOK_CONFIG.scopes.join(','))
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', TIKTOK_CONFIG.redirectUri)

    return NextResponse.redirect(authUrl.toString())
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
