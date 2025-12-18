# **Story 2.4: Video Generation Trigger (Kie.ai Integration)**

## **Status: Draft**

## **Story**

* As a User  
* I want to click "Generate" to start the video creation  
* so that I can get my final asset

## **Acceptance Criteria (ACs)**

1. Backend API route /api/generate/video created.  
2. Route verifies user has sufficient credits.  
3. Route calls Kie.ai API with the final script and selected images.  
4. Credits are tentatively deducted (or reserved).  
5. Kie.ai task\_id is stored in a videos database table with status PROCESSING.  
6. UI redirects user to the Dashboard/History view.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1, 2\) Credit Check  
  * \[ \] In API POST /api/generate/video, fetch user profile.  
  * \[ \] Return 402 if credits\_balance \< 1\.  
* \[ \] Task 2 (AC: 3\) Call Kie.ai  
  * \[ \] Implement KieClient.createVideo(script, images).  
  * \[ \] Handle API errors gracefully.  
* \[ \] Task 3 (AC: 4, 5\) Transaction & DB  
  * \[ \] Run Supabase Transaction:  
    * \[ \] Insert videos row (status: PROCESSING, kie\_task\_id).  
    * \[ \] Insert transactions row (type: GENERATION, amount: \-1).  
    * \[ \] Trigger updates user balance.  
* \[ \] Task 4 (AC: 6\) Redirect  
  * \[ \] Frontend receives success (Video ID).  
  * \[ \] Redirect to /library.

## **Dev Technical Guidance**

* **Atomic Operation:** The DB insert and Credit deduction MUST happen together.  
* **Kie.ai:** Check documentation for required payload format (aspect ratio, duration).