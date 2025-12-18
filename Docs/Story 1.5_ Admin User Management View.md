# **Story 1.5: Admin User Management View**

## **Status: Draft**

## **Story**

* As an Admin  
* I want to view a list of all users, their credit balances, and transaction history  
* so that I can support customers efficiently and manage platform usage

## **Acceptance Criteria (ACs)**

1. **Admin-Only Access:** Route /admin/users is strictly protected; non-admin users are redirected to the dashboard or 404\.  
2. **Dense Data Table:** Users displayed in a high-density table view showing Email, ID, Sign-Up Date, and Current Credits.  
3. **Sorting & Filtering:** Table supports sorting by Sign-Up Date and Credit Balance, and filtering by Email.  
4. **Credit Adjustment Action:** "Adjust Balance" action available on each row, opening a modal to add/remove credits with a required "Reason" field.  
5. **Transaction Logging:** All manual credit adjustments must log a transaction of type BONUS or REFUND in the database for audit trails.

## **Tasks / Subtasks**

* \[ \] Task 1 (AC: 1\) Admin Route Protection  
  * \[ \] Implement AdminGuard component or Middleware check.  
  * \[ \] Validation logic: Check session.user.email against process.env.ADMIN\_EMAILS (or users.role if DB role field exists).  
* \[ \] Task 2 (AC: 2, 3\) User Data Table (UI)  
  * \[ \] Create app/(dashboard)/admin/users/page.tsx.  
  * \[ \] Implement Shadcn/UI Table component with "Compact" styling (reduced padding).  
  * \[ \] Add Sort headers for "Credits" and "Date".  
  * \[ \] Add Search input for "Email".  
* \[ \] Task 3 (AC: 2\) User Data Fetching (Backend)  
  * \[ \] Create Server Action getAdminUsers() using supabase-admin client (Service Role).  
  * \[ \] Fetch users and join with transactions (sum) or read credits\_balance.  
  * \[ \] Implement server-side pagination (limit 50).  
* \[ \] Task 4 (AC: 4, 5\) Credit Adjustment Logic  
  * \[ \] Create API/Action adjustUserCredits(userId, amount, reason).  
  * \[ \] Implement UI Modal: Input for Amount (+/-), Dropdown/Input for Reason.  
  * \[ \] Backend: Insert transactions row (type: BONUS or REFUND, description: reason).  
  * \[ \] Backend: Trigger DB update for users.credits\_balance.  
  * \[ \] UI: Optimistic update of the row's credit balance.

## **Dev Technical Guidance**

* **Service Role Key:** You MUST use the SUPABASE\_SERVICE\_ROLE\_KEY to list all users; standard anon key cannot see the auth.users table or other users' public data due to RLS.  
* **Security:** Ensure the adjustUserCredits endpoint double-checks that the *caller* is an Admin before executing the transaction.  
* **UI UX:** Follow the "Operations Console" vibe—monospace fonts for IDs and Credits, standard sans for Emails. Use Destructive (Red) color for negative adjustments and Success (Green) for positive ones in the modal.