# **Story 2.3: The "Review Step" UI**

## **Status: Draft**

## **Story**

* As a User  
* I want to edit the AI-generated script and select images  
* so that I can ensure the video message is accurate before spending credits

## **Acceptance Criteria (ACs)**

1. "Review" step UI displays the editable Script text area.  
2. UI displays a grid of available images (scraped or uploaded) allowing selection/deselection.  
3. "Generate Video" button is disabled if no images are selected or script is empty.  
4. "Generate Video" button displays the credit cost (e.g., "-1 Credit").

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1\) Split Screen UI  
  * \[ \] Create app/(dashboard)/wizard/script/page.tsx (Step 2).  
  * \[ \] Left col: Static Product Info. Right col: Textarea for Script.  
* \[ \] Task 2 (AC: 2\) Image Selection  
  * \[ \] Display images grid.  
  * \[ \] Implement click-to-select logic (update Wizard Context selectedImages).  
* \[ \] Task 3 (AC: 3, 4\) Validation & CTA  
  * \[ \] Add "Generate Video" button.  
  * \[ \] Add label "Cost: 1 Credit".  
  * \[ \] Disable if script.length \< 10 or selectedImages.length \=== 0\.

## **Dev Technical Guidance**

* **UX:** Follow the UI Spec "High Control" philosophy.  
* **Images:** If images are from Amazon (external URLs), ensure we handle CORS/Hotlinking issues (might need to proxy them or just display standard img tags if Amazon allows).