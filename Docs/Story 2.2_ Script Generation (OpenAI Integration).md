Story 2.2: Script Generation (OpenAI Integration)

Status: Draft

Story

As a User

I want the system to write a video script based on my product details

so that I don't have to write it myself

Acceptance Criteria (ACs)

API Route: api/generate/script connects to OpenAI (GPT-4o).

Prompt Engineering: Generates a 30s UGC-style script (Hook, Body, CTA) based on product metadata.

Loading State: UI displays a rich "Processing" state (not just a spinner) explaining "Analyzing product... Writing script..."

Auto-Trigger: If the user enters Step 2 with metadata but no script, generation triggers automatically.

Tasks / Subtasks

[ ] Task 1 (AC: 1, 2) OpenAI Integration

[ ] Install openai.

[ ] Implement api/generate/script.

[ ] System Prompt: "You are an expert UGC scripter. Create a viral TikTok script for..."

[ ] Task 2 (AC: 3, 4) Frontend Integration

[ ] In wizard/script/page.tsx (Step 2), add useEffect to check if script is empty.

[ ] If empty, call API.

[ ] Show Skeleton loader or "Thinking" animation during fetch.

[ ] Update useWizardStore with result.

Dev Technical Guidance

Error Handling: If OpenAI fails (500), show a toast "Failed to generate script" but allow the user to manually type one in the next step (don't block the flow).

Cost: Use gpt-4o-mini for development.