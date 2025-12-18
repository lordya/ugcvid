# **Story 4.2: System Analytics Dashboard**

## **Status: Draft**

## **Story**

* As an Admin  
* I want to see high-level system stats  
* so that I know how the SaaS is performing

## **Acceptance Criteria (ACs)**

1. Admin Dashboard displays "Total Users" count.  
2. Admin Dashboard displays "Total Videos Generated" count.  
3. Admin Dashboard displays "Total Credits Consumed" count.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1, 2, 3\) Stats Calculation  
  * \[ \] Create API api/admin/stats.  
  * \[ \] Perform COUNT(\*) queries on users and videos.  
  * \[ \] Sum amount from transactions where type='GENERATION'.  
* \[ \] Task 2 UI  
  * \[ \] Display 3 Cards with big numbers on /admin/page.tsx.

## **Dev Technical Guidance**

* **Performance:** For MVP, live counts are fine. Post-MVP, cache this or use Supabase approximate counts.