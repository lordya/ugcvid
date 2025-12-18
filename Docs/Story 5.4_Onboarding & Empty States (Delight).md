Story 5.4: Onboarding & Empty States (Delight)

Status: Draft

Story

As a New User

I want to be guided to my first success

so that I don't feel lost in an empty dashboard

Acceptance Criteria (ACs)

First Run Experience: If videos.length === 0, show a "Welcome Guide" modal or dismissible banner pointing to the "Create" button with a pulsing ring.

Smart Empty State: The Library empty state should be an illustration + "Create your first video" CTA, not just text.

Rich Toasts: Toast notifications for async tasks (Generation Started) include a progress bar or "View" action button.

Demo Video: (Optional) If possible, auto-populate a "Welcome to AFP UGC" video in the library for new users so they see a "Ready" state immediately.

Tasks / Subtasks

[ ] Task 1 (AC: 1, 2) Onboarding Logic

[ ] Check user video count.

[ ] Render OnboardingBanner component if count is 0.

[ ] Style the "Create" button in the Sidebar with a animate-pulse ring if count is 0.

[ ] Task 2 (AC: 3) Enhanced Toasts

[ ] Use sonner (Shadcn default) custom content to render a progress bar in the toast.

[ ] Task 3 (AC: 4) Demo Data

[ ] Create a migration or logic in handle_new_user trigger to insert a default "Welcome" video row (pointing to a static S3 asset).

Dev Technical Guidance

Persistence: Use localStorage to remember if the user dismissed the Welcome Guide so it doesn't annoy them.