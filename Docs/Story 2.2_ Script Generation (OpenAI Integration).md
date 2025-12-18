# **Story 2.2: Script Generation (OpenAI Integration)**

## **Status: Draft**

## **Story**

* As a User  
* I want the system to write a video script based on my product details  
* so that I don't have to write it myself

## **Acceptance Criteria (ACs)**

1. Backend API route /api/generate/script created.  
2. Integration with OpenAI API (GPT-4o) to generate a UGC-style script from product metadata.  
3. UI displays a loading state while generating.  
4. Generated script text returned to the UI state.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1, 2\) OpenAI Route  
  * \[ \] Create api/generate/script.  
  * \[ \] Install openai package.  
  * \[ \] Construct prompt: "Write a 30-second UGC video script for TikTok about \[Product\]..."  
  * \[ \] Call OpenAI API and return content.  
* \[ \] Task 2 (AC: 3, 4\) Frontend Integration  
  * \[ \] In Wizard Step 1, when clicking "Next", call this API if Amazon data is present.  
  * \[ \] Show "Generating Script..." skeleton loader.  
  * \[ \] Store result in Wizard Context script field.

## **Dev Technical Guidance**

* **Prompt Engineering:** Keep the prompt focused on "visual cues" and "voiceover text" separate if possible, or just raw text for MVP.  
* **Cost:** Use gpt-4o-mini for cost efficiency during dev, or gpt-3.5-turbo.