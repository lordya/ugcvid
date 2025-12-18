# **Story 4.1: Admin Content Moderation**

## **Status: Draft**

## **Story**

* As an Admin  
* I want to see a feed of all generated videos  
* so that I can ban users generating abusive content

## **Acceptance Criteria (ACs)**

1. Admin route /admin/moderation created.  
2. Grid view of all COMPLETED videos from all users, ordered by newest.  
3. "Block User" or "Delete Video" actions available on each card.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1, 2\) Moderation Feed  
  * \[ \] Create page.  
  * \[ \] Fetch global video list (Server Component \+ Supabase Admin).  
* \[ \] Task 2 (AC: 3\) Actions  
  * \[ \] Add "Delete" button (Updates videos status to DELETED or hard deletes).  
  * \[ \] Add "Ban User" button (Updates users table or Supabase Auth status).

## **Dev Technical Guidance**

* **Privacy:** Only Admins should see this data.