Story 11.1: CSV Upload & Validation

Parent Epic: Epic 11 - Bulk Generation Engine (CSV Upload)

Description

As a Power User,
I want to upload a CSV containing a list of Amazon URLs,
So that I don't have to copy-paste them one by one.

Acceptance Criteria

[ ] Entry Point: New "Bulk Generate" button added to the Wizard landing page or a dedicated "Bulk" tab.

[ ] File Support: Uploader accepts .csv files.

[ ] Format: Expected format: url (required), custom_title (optional), style (optional).

[ ] Validation (Client-side):

Check file size (< 2MB).

Check row count (Max 50 per batch).

Regex check for valid Amazon URLs in the first column.

[ ] Validation (Server-side):

Parse CSV.

Return a summary object: { total: 50, valid: 48, invalid_rows: [2, 14] }.

Display summary to user before confirmation.

Technical Notes

Library: Use papaparse for client-side parsing/preview.

UX: Allow user to correct/remove invalid rows in the UI before submitting.