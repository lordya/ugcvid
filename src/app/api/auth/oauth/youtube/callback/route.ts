import { NextRequest, NextResponse } from 'next/server'
import { storeOAuthTokens } from '@/app/actions/settings'

// Google OAuth configuration for YouTube
const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/youtube/callback`,
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  youtubeChannelsUrl: 'https://www.googleapis.com/youtube/v3/channels',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('YouTube OAuth error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=oauth_failed&provider=youtube', request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?error=missing_code&provider=youtube', request.url)
    )
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(GOOGLE_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CONFIG.clientId,
        client_secret: GOOGLE_CONFIG.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_CONFIG.redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(`Google API error: ${tokenData.error_description}`)
    }

    // Get user info
    const userInfoResponse = await fetch(GOOGLE_CONFIG.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      throw new Error(`User info fetch failed: ${userInfoResponse.status}`)
    }

    const userInfo = await userInfoResponse.json()

    // Get YouTube channel info
    const channelsResponse = await fetch(
      `${GOOGLE_CONFIG.youtubeChannelsUrl}?part=snippet&mine=true`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      }
    )

    let channelData = null
    if (channelsResponse.ok) {
      const channelsInfo = await channelsResponse.json()
      if (channelsInfo.items && channelsInfo.items.length > 0) {
        channelData = channelsInfo.items[0]
      }
    }

    // Store the integration
    const result = await storeOAuthTokens({
      provider: 'YOUTUBE',
      providerUserId: userInfo.id,
      providerUsername: channelData?.snippet?.customUrl?.replace('@', '') || userInfo.email.split('@')[0],
      providerDisplayName: channelData?.snippet?.title || userInfo.name,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
      metadata: {
        email: userInfo.email,
        picture: userInfo.picture,
        channel_id: channelData?.id,
        channel_title: channelData?.snippet?.title,
        channel_description: channelData?.snippet?.description,
        subscriber_count: channelData?.statistics?.subscriberCount,
      },
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to store integration')
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/settings?success=youtube_connected', request.url)
    )

  } catch (error) {
    console.error('YouTube OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=oauth_error&provider=youtube', request.url)
    )
  }
}
