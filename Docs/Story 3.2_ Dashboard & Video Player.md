# **Story 3.2: Dashboard & Video Player**

## **Status: Draft**

## **Story**

* As a User  
* I want to see my generated videos and play them  
* so that I can review the final output

## **Acceptance Criteria (ACs)**

1. Dashboard grid view displaying all user videos.  
2. Video cards show thumbnail and status badge (Processing, Done, Failed).  
3. Clicking a "Done" video opens a modal or page with a Video Player.  
4. Video player supports portrait playback.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1, 2\) Dashboard Grid  
  * \[ \] Create app/(dashboard)/library/page.tsx.  
  * \[ \] Fetch user videos (descending date).  
  * \[ \] Render Cards with Thumbnail (if available) or Skeleton (if processing).  
* \[ \] Task 2 (AC: 3, 4\) Player Modal  
  * \[ \] Create a Dialog/Modal component.  
  * \[ \] Embed \<video\> tag with controls.  
  * \[ \] Ensure 9:16 aspect ratio is preserved.

## **Dev Technical Guidance**

* **Thumbnails:** If Kie.ai provides a thumbnail URL, store/use it. If not, use a generic placeholder until user plays.