# **Story 2.1: The Wizard Shell & Input Step**

## **Status: Draft**

## **Story**

* As a User  
* I want to enter an Amazon URL or manual product details  
* so that I can start the video creation process

## **Acceptance Criteria (ACs)**

1. Wizard layout created with progress stepper (Input \-\> Script \-\> Generate).  
2. "Amazon Input" tab implemented: Input field for URL \+ "Fetch" button.  
3. "Manual Input" tab implemented: Fields for Title, Description, and Image Upload (to Supabase Storage).  
4. On Amazon Fetch, backend scrapes (or mock-scrapes) title/desc/images and returns them to UI state.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1\) Wizard Shell  
  * \[ \] Create app/(dashboard)/wizard/layout.tsx with a shared WizardProvider (Zustand or React Context) to hold state across steps.  
  * \[ \] Create visual stepper component showing current step.  
* \[ \] Task 2 (AC: 2\) Amazon Input UI  
  * \[ \] Create app/(dashboard)/wizard/page.tsx (Step 1).  
  * \[ \] Implement URL Input with Zod validation.  
  * \[ \] Create API route api/generate/scrape (Mock for now: returns hardcoded data after 2s delay).  
* \[ \] Task 3 (AC: 3\) Manual Input UI  
  * \[ \] Create Tabs for "Amazon" vs "Manual".  
  * \[ \] Implement File Uploader for images (upload to temp-uploads bucket in Supabase).  
* \[ \] Task 4 (AC: 4\) State Management  
  * \[ \] Ensure fetched/entered data is stored in the Wizard Context.  
  * \[ \] "Next" button routes to /wizard/script.

## **Dev Technical Guidance**

* **State:** Use a global client-side store (Zustand recommended) for the Wizard because we need to persist data (images, script) between steps without saving to the DB until the very end.  
* **Scraper:** For this story, just return dummy data from the API to unblock UI dev.