Story 4.1: Admin Content Moderation

Status: Draft

Story

As an Admin

I want to see a feed of all generated videos

so that I can ban users generating abusive content

Acceptance Criteria (ACs)

Operations Console: Admin route /admin/moderation with a high-density grid view.

Video Feed: Display all COMPLETED videos sorted by newest.

Actions: "Block User" (Destructive Red) and "Delete Video".

Tasks / Subtasks

[ ] Task 1 (AC: 1, 2) Feed UI

[ ] Create page.

[ ] Fetch videos using Service Role (bypass RLS).

[ ] Task 2 (AC: 3) Actions

[ ] Implement API actions to update users.banned or videos.status = 'DELETED'.

Dev Technical Guidance

Security: Ensure strict Admin role checking.