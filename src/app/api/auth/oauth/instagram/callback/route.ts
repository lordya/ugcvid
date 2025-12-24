import { NextRequest, NextResponse } from 'next/server'
import { storeOAuthTokens } from '@/app/actions/settings'

// Meta OAuth configuration for Instagram
const META_CONFIG = {
  clientId: process.env.META_CLIENT_ID!,
  clientSecret: process.env.META_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/instagram/callback`,
  tokenUrl: 'https://api.instagram.com/oauth/access_token',
  longLivedTokenUrl: 'https://graph.instagram.com/access_token',
  userInfoUrl: 'https://graph.instagram.com/me',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('Instagram OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL('/settings?error=oauth_failed&provider=instagram', request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?error=missing_code&provider=instagram', request.url)
    )
  }

  try {
    // Exchange code for short-lived access token
    const tokenResponse = await fetch(META_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: META_CONFIG.clientId,
        client_secret: META_CONFIG.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: META_CONFIG.redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(`Meta API error: ${tokenData.error.message}`)
    }

    // Exchange for long-lived access token (60 days)
    const longLivedTokenUrl = new URL(META_CONFIG.longLivedTokenUrl)
    longLivedTokenUrl.searchParams.set('grant_type', 'ig_exchange_token')
    longLivedTokenUrl.searchParams.set('client_secret', META_CONFIG.clientSecret)
    longLivedTokenUrl.searchParams.set('access_token', tokenData.access_token)

    const longLivedTokenResponse = await fetch(longLivedTokenUrl.toString())

    let accessToken = tokenData.access_token
    let expiresAt = new Date(Date.now() + (3600 * 1000)) // 1 hour default

    if (longLivedTokenResponse.ok) {
      const longLivedData = await longLivedTokenResponse.json()
      if (!longLivedData.error) {
        accessToken = longLivedData.access_token
        expiresAt = new Date(Date.now() + (longLivedData.expires_in * 1000))
      }
    }

    // Get user info
    const userInfoResponse = await fetch(
      `${META_CONFIG.userInfoUrl}?fields=id,username,account_type,media_count&access_token=${accessToken}`
    )

    if (!userInfoResponse.ok) {
      throw new Error(`User info fetch failed: ${userInfoResponse.status}`)
    }

    const userInfo = await userInfoResponse.json()

    if (userInfo.error) {
      throw new Error(`Instagram user info error: ${userInfo.error.message}`)
    }

    // Store the integration
    const result = await storeOAuthTokens({
      provider: 'INSTAGRAM',
      providerUserId: userInfo.id,
      providerUsername: userInfo.username,
      providerDisplayName: userInfo.username, // Instagram doesn't provide display name
      accessToken: accessToken,
      tokenExpiresAt: expiresAt,
      metadata: {
        account_type: userInfo.account_type,
        media_count: userInfo.media_count,
      },
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to store integration')
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/settings?success=instagram_connected', request.url)
    )

  } catch (error) {
    console.error('Instagram OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=oauth_error&provider=instagram', request.url)
    )
  }
}
