Story 3.1: Video Status Polling

Status: Draft

Story

As a System

I want to check the status of processing videos

so that I can mark them as "Completed" or "Failed" for the user

Acceptance Criteria (ACs)

API /api/videos/[id]/status checks Kie.ai status.

If status is COMPLETED, update DB with video_url.

If status is FAILED, update DB and trigger automatic credit refund (type: REFUND).

Frontend polls this endpoint for any video in PROCESSING state.

Tasks / Subtasks

[ ] Task 1 (AC: 1, 2, 3) Status Endpoint

[ ] Implement logic to fetch task status from Kie.ai.

[ ] Handle state transitions (Processing -> Done/Failed).

[ ] Task 2 (AC: 4) Polling Hook

[ ] Create useVideoStatus(videoId) hook.

[ ] Poll every 5s if status is Processing.

Dev Technical Guidance

Refunds: The refund transaction MUST be logged if the generation fails. This builds trust.