Story 5.3: User Settings & Account Management

Status: Draft

Story

As a User

I want a dedicated area to manage my profile and subscription

so that I can keep my account details up to date

Acceptance Criteria (ACs)

Profile Settings: Page to update Name and Avatar (upload to Supabase).

Billing Portal: View current credit balance, transaction history (table), and a link to the external billing portal (Lemon Squeezy / Cryptomus).

Preferences: Toggle for Email Notifications (e.g., "Email me when video is ready").

Theme Toggle: Explicit option to switch between System/Dark/Light (though Dark is default, choice is good).

Tasks / Subtasks

[ ] Task 1 (AC: 1) Profile Page

[ ] Create app/(dashboard)/settings/page.tsx.

[ ] Form for display_name update.

[ ] Image uploader for avatar_url.

[ ] Task 2 (AC: 2) Billing Tab

[ ] Fetch transactions list.

[ ] Render simple table of purchases/usage.

[ ] Task 3 (AC: 3) Preferences

[ ] Add preferences JSONB column to users table (migration needed).

[ ] Create Toggles for notifications.

Dev Technical Guidance

Schema Change: You will need to add a migration for the preferences column on the users table if it doesn't exist.