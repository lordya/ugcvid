import { NextRequest, NextResponse } from 'next/server'

// Google OAuth configuration for YouTube
const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/youtube/callback`,
  authUrl: 'https://accounts.google.com/oauth/authorize',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  youtubeChannelsUrl: 'https://www.googleapis.com/youtube/v3/channels',
  scopes: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'connect') {
    // Redirect to Google OAuth
    const authUrl = new URL(GOOGLE_CONFIG.authUrl)
    authUrl.searchParams.set('client_id', GOOGLE_CONFIG.clientId)
    authUrl.searchParams.set('redirect_uri', GOOGLE_CONFIG.redirectUri)
    authUrl.searchParams.set('scope', GOOGLE_CONFIG.scopes.join(' '))
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('access_type', 'offline') // Request refresh token
    authUrl.searchParams.set('prompt', 'consent') // Force consent screen for refresh token

    return NextResponse.redirect(authUrl.toString())
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
