# **Story 3.1: Video Status Polling**

## **Status: Draft**

## **Story**

* As a System  
* I want to check the status of processing videos  
* so that I can mark them as "Completed" or "Failed" for the user

## **Acceptance Criteria (ACs)**

1. Client-side polling hook (or cron job) implemented to check status of PROCESSING videos.  
2. Calls Kie.ai status endpoint using task\_id.  
3. On success, updates DB with video\_url and status COMPLETED.  
4. On failure, updates status FAILED and automatically refunds the user's credit.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 2\) Status API  
  * \[ \] Create api/videos/\[id\]/status.  
  * \[ \] Fetch video from DB. If COMPLETED, return URL.  
  * \[ \] If PROCESSING, call Kie.ai getTaskStatus.  
  * \[ \] If Kie says "SUCCEEDED", update DB row (video\_url, status=COMPLETED) and return.  
  * \[ \] If Kie says "FAILED", trigger CreditManager.refund(userId) and update DB status=FAILED.  
* \[ \] Task 2 (AC: 1\) Frontend Polling  
  * \[ \] In the Dashboard Video Card component, if status is PROCESSING, use useSWR or react-query to poll this endpoint every 5s.

## **Dev Technical Guidance**

* **Optimization:** Only poll while the user is online.  
* **Refunds:** Critical to implement the auto-refund logic here so users don't lose credits on failed generations.