# **Story 3.3: Download Functionality**

## **Status: Draft**

## **Story**

* As a User  
* I want to download the MP4 file  
* so that I can upload it to TikTok or Reels

## **Acceptance Criteria (ACs)**

1. "Download" button added to the Video Player view.  
2. Clicking triggers a browser download of the MP4 file from the storage URL.  
3. Filename is sanitized and meaningful (e.g., afp-ugc-{product-name}.mp4).

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1, 2\) Download Button  
  * \[ \] Add button to Player Modal.  
  * \[ \] Implement downloadFile(url, filename) helper.  
  * \[ \] Ensure CORS allows download from the storage bucket.

## **Dev Technical Guidance**

* **Proxies:** If the video URL is external (Kie.ai) and doesn't allow direct browser download (headers), might need a simple API route to proxy the stream or fetch-and-blob on the client.