import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { storeOAuthTokens } from '@/app/actions/settings'

// TikTok OAuth configuration
const TIKTOK_CONFIG = {
  clientId: process.env.TIKTOK_CLIENT_ID!,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/tiktok/callback`,
  tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
  userInfoUrl: 'https://open-api.tiktok.com/user/info/',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('TikTok OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL('/settings?error=oauth_failed&provider=tiktok', request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?error=missing_code&provider=tiktok', request.url)
    )
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(TIKTOK_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CONFIG.clientId,
        client_secret: TIKTOK_CONFIG.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: TIKTOK_CONFIG.redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(`TikTok API error: ${tokenData.error_description}`)
    }

    // Get user info
    const userInfoResponse = await fetch(
      `${TIKTOK_CONFIG.userInfoUrl}?fields=open_id,union_id,avatar_url,display_name,username`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      }
    )

    if (!userInfoResponse.ok) {
      throw new Error(`User info fetch failed: ${userInfoResponse.status}`)
    }

    const userInfo = await userInfoResponse.json()

    if (userInfo.error) {
      throw new Error(`TikTok user info error: ${userInfo.error_description}`)
    }

    // Store the integration
    const result = await storeOAuthTokens({
      provider: 'TIKTOK',
      providerUserId: userInfo.data.open_id,
      providerUsername: userInfo.data.username,
      providerDisplayName: userInfo.data.display_name,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
      metadata: {
        avatar_url: userInfo.data.avatar_url,
        union_id: userInfo.data.union_id,
      },
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to store integration')
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/settings?success=tiktok_connected', request.url)
    )

  } catch (error) {
    console.error('TikTok OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=oauth_error&provider=tiktok', request.url)
    )
  }
}
