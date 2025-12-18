Story 5.1: Global Navigation & App Shell

Status: Draft

Story

As a User

I want a persistent navigation structure that works on both desktop and mobile

so that I can easily switch between creating videos, viewing my library, and managing my account

Acceptance Criteria (ACs)

Desktop Sidebar: Persistent left sidebar (w-64, fixed) containing: Logo, Nav Links (Create, Library, Billing, Settings), and User Profile dropdown.

Mobile Bottom Nav: Sticky bottom bar visible on small screens with icons for primary actions (Library, Create, Account).

Active States: Current route is highlighted with bg-layer-3 and Electric Indigo accent text/icon.

Command Palette: Cmd+K (or Ctrl+K) triggers a modal search to quickly jump to any page or trigger "New Video".

Responsive Layout: The main content area adjusts margins automatically based on device (ml-64 on desktop, pb-16 on mobile).

Tasks / Subtasks

[ ] Task 1 (AC: 1, 5) Desktop Shell

[ ] Create components/layout/Sidebar.tsx.

[ ] Implement app/(dashboard)/layout.tsx to render Sidebar on desktop.

[ ] Task 2 (AC: 2) Mobile Shell

[ ] Create components/layout/MobileNav.tsx.

[ ] Render conditionally in layout (hidden on lg+).

[ ] Task 3 (AC: 3) Navigation Logic

[ ] Use usePathname to determine active state.

[ ] Style active links with #6366F1 text.

[ ] Task 4 (AC: 4) Command Palette

[ ] Install cmdk (Shadcn/UI Command).

[ ] Implement global event listener for Cmd+K.

[ ] Add groups: "Navigation", "Actions".

Dev Technical Guidance

Layout: Ensure the Sidebar is fixed h-screen and the main content has ml-64 to prevent overlap.

Icons: Use lucide-react for consistent iconography.