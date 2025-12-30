# **Story 13.2: Advanced Script Generation API**

## **Status: Completed**

## **Story**

* As a System
* I want to generate multiple script variations in parallel using the "Clean Direct" format
* So that the user receives high-quality, distinct options without waiting 3x longer.

## **Acceptance Criteria (ACs)**

1. **Route Update:** `POST /api/generate/script` accepts `video_id` (optional) and `manual_angle_ids` (optional array).
2. **Selection Logic:**
   * If no angles provided, randomly select 3 distinct active angles from `script_angles` (e.g., 1 Logical, 1 Emotional, 1 Viral).
3. **Parallel Execution:** The system calls OpenAI (GPT-4o) for all selected angles simultaneously (Promise.all).
4. **Prompt Engineering:**
   * Uses the "God Mode" System Prompt.
   * Injects the Angle's keywords and description dynamically.
   * Enforces "Clean Direct Script" output (no JSON, no "Scene 1", just spoken text).
5. **Persistence:**
   * Saves the 3 results to `video_scripts` table linked to the `video_id` (if provided).
6. **Response:** Returns the array of generated scripts with their Angle metadata.

## **Tasks / Subtasks**

* [x] **Create `src/lib/script-engine.ts`** (AC: 2)
  * [x] Implement `selectAngles()` function for random/manual angle selection
  * [x] Implement `saveVideoScripts()` function for DB persistence
  * [x] Add fallback logic for hardcoded "General" angle
* [x] **Update `src/lib/prompts.ts`** (AC: 4)
  * [x] Add `replaceAnglePlaceholders()` function for dynamic placeholders
  * [x] Add `replacePromptPlaceholdersWithAngles()` function combining angle + language/model enhancements
  * [x] Create "God Mode" system prompt for Clean Direct Script format
* [x] **Update Route Interface** (AC: 1)
  * [x] Modify `ScriptGenerationRequest` to include `video_id` and `manual_angle_ids`
  * [x] Create `AdvancedScriptGenerationResponse` interface
* [x] **Implement Parallel Generation** (AC: 3)
  * [x] Create `generateAdvancedScripts()` function using `Promise.all`
  * [x] Add branching logic in main POST handler
  * [x] Implement individual error handling per angle
* [x] **Database Integration** (AC: 5)
  * [x] Ensure `video_scripts` table insertions work correctly
  * [x] Return `video_script_id` in response when saved
* [x] **Response Formatting** (AC: 6)
  * [x] Structure response with angle metadata
  * [x] Maintain backward compatibility for single script generation

## **Dev Technical Guidance**

* **Database Schema:** Uses existing `script_angles` and `video_scripts` tables from migration `20251230010216_add_script_engine_tables.sql`
* **Parallel Processing:** `Promise.all` ensures all 3 OpenAI calls execute simultaneously, not sequentially
* **Clean Output:** "God Mode" prompt explicitly forbids markdown formatting (`**bold**`, `*italic*`, scene numbers) to ensure TTS-ready output
* **Fallbacks:** If DB fetch for angles fails, falls back to hardcoded "General" angle constant
* **Backward Compatibility:** Existing single script generation remains unchanged when `video_id`/`manual_angle_ids` not provided
* **Error Handling:** Individual angle generation failures don't stop other angles from completing
* **Type Safety:** Full TypeScript coverage with proper interfaces for request/response objects
