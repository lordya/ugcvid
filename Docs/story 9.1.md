Story 9.1: Social Account Linking (OAuth)

Parent Epic: Epic 9 - Social Media Management & Auto-Posting

Description

As a User,
I want to connect my TikTok, YouTube, and Instagram business accounts in the "Settings" area,
So that the platform has permission to post content on my behalf.

Acceptance Criteria

[ ] Settings UI: A new "Integrations" tab is added to the Settings page (/settings).

[ ] Providers: Distinct "Connect" buttons for TikTok, YouTube, and Instagram.

[ ] OAuth Flow: Clicking "Connect" triggers the standard OAuth 2.0 flow for the respective provider.

[ ] Token Storage: Access tokens and refresh tokens are securely encrypted and stored in the user_integrations table (new table required).

[ ] State Management: The UI reflects the "Connected" state with the account name/handle displayed.

[ ] Disconnection: Users can revoke access/disconnect accounts at any time.

Technical Notes

New Table: user_integrations (user_id, provider, provider_user_id, access_token, refresh_token, token_expires_at, metadata).

Security: Tokens MUST be encrypted at rest (Supabase Vault or similar encryption column).

API Scopes:

TikTok: video.upload, user.info.basic

Google (YouTube): youtube.upload, youtube.readonly

Meta (Instagram): instagram_basic, instagram_content_publish