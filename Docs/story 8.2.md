Story 8.2: Template Logic Implementation (Style + Duration)

Status: Draft

Story

As a User

I want the AI to generate a script that strictly follows my chosen style AND time limit

so that I don't get a 30-second script when I asked for a 10-second hook

Acceptance Criteria (ACs)

Prompt Registry: Use docs/prompts/template-system-prompts.md as the source of truth. It now contains 10 keys (5 styles * 2 durations).

API Update: api/generate/script accepts style AND duration in the request body.

Prompt Selection Logic: Construct the lookup key as ${style}_${duration} (e.g., ugc_auth_10s).

Validation: Ensure the selected prompt exists. If not, fallback to ugc_auth_30s.

Output Parsing: The API handles the JSON response which matches the unified schema (visual_cues, voiceover, text_overlay).

Tasks / Subtasks

[ ] Task 1 (AC: 1) Prompt Registry

[ ] Update lib/ai/prompts.ts.

[ ] Export PROMPTS object with keys like ugc_auth_30s, ugc_auth_10s, etc.

[ ] Copy the exact system prompt text from the documentation.

[ ] Task 2 (AC: 2, 3) API Logic

[ ] Update app/api/generate/script/route.ts.

[ ] Destructure style and duration from body.

[ ] Logic: const promptKey = ${style}_${duration};

[ ] Fetch systemPrompt = PROMPTS[promptKey].

[ ] Task 3 (AC: 4) Error Handling

[ ] If !systemPrompt, log warning and use default.

Dev Technical Guidance

Naming: Ensure the frontend sends duration exactly as '10s' or '30s' to match the registry keys.

Testing: Verify that requesting a 10s script results in a JSON with significantly shorter word counts (< 25 words) compared to 30s.