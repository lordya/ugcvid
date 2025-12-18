Story 2.4: Video Generation Trigger (Kie.ai Integration)

Status: Draft

Story

As a User

I want to click "Generate" to start the video creation process

so that I can get my final asset

Acceptance Criteria (ACs)

API Route: api/generate/video handles the transaction.

Atomic Transaction: Verifies credit > 0, deducts 1 credit, creates videos record (PROCESSING), and creates transactions record.

Kie.ai Trigger: Calls Kie.ai API to start the job.

Optimistic UI: Frontend immediately redirects to Library with a "Generation Started" toast.

Error Safety: If Kie.ai fails immediately, database transaction is rolled back (or refunded).

Tasks / Subtasks

[ ] Task 1 (AC: 1, 2) Transaction Logic

[ ] Create api/generate/video.

[ ] Use supabase-admin (Service Role) to perform the check-and-deduct.

[ ] Task 2 (AC: 3) External API

[ ] POST to Kie.ai with script, source_images, and aspect_ratio: 9:16.

[ ] Get task_id.

[ ] Task 3 (AC: 4, 5) Frontend Handoff

[ ] On "Generate" click, call API.

[ ] On Success: Clear Wizard Store, Redirect to /library.

[ ] On Error: Show Toast, remain on Review step.

Dev Technical Guidance

Kie.ai: Ensure we send the selected images only.

Data Integrity: The videos table MUST store the kie_task_id so we can poll it later in Epic 3.