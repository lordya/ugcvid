import { NextRequest, NextResponse } from 'next/server'

// Meta OAuth configuration for Instagram
const META_CONFIG = {
  clientId: process.env.META_CLIENT_ID!,
  clientSecret: process.env.META_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/instagram/callback`,
  authUrl: 'https://api.instagram.com/oauth/authorize',
  tokenUrl: 'https://api.instagram.com/oauth/access_token',
  longLivedTokenUrl: 'https://graph.instagram.com/access_token',
  userInfoUrl: 'https://graph.instagram.com/me',
  scopes: ['instagram_basic', 'instagram_content_publish', 'user_profile'],
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'connect') {
    // Redirect to Meta OAuth
    const authUrl = new URL(META_CONFIG.authUrl)
    authUrl.searchParams.set('client_id', META_CONFIG.clientId)
    authUrl.searchParams.set('redirect_uri', META_CONFIG.redirectUri)
    authUrl.searchParams.set('scope', META_CONFIG.scopes.join(','))
    authUrl.searchParams.set('response_type', 'code')

    return NextResponse.redirect(authUrl.toString())
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
