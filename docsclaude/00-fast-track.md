# Fast-Track Engineering Onboarding (Weekend Plan)

This guide is designed for experienced engineers who need to understand the structural layout of the AntiHelpdesk codebase in a single day or weekend.

---

## Timed Blocks

### Block 1: Repository Topology & Scaffolding (90 Minutes)
- **Goal:** Comprehend the monorepo structure, package wiring, and boundary separation.
- **Steps:**
  1. Open the root [package.json:1-12](package.json#L1-L12). Note how npm workspaces splits the backend and frontend into separated modules.
  2. Inspect the database schema at [backend/prisma/schema.prisma:1-55](backend/prisma/schema.prisma#L1-L55). Identify how `Organization` maps down to `User`, `Ticket`, and `TicketActivity` through relational keys, establishing strict tenant boundaries.
  3. Run the bootstrap setup locally using `npm install` and verify the compilation using `npm run build` or `npx tsc --noEmit` across both directories.

---

### Block 2: The Primary Feature Thread (120 Minutes)
- **Goal:** Trace a single request from the user interface down to database persistence.
- **Steps:**
  1. **UI Submission:** Open [frontend/src/features/tickets/pages/CreateTicketPage.tsx:32-55](frontend/src/features/tickets/pages/CreateTicketPage.tsx#L32-L55) to trace how React Hook Form processes ticket payloads and invokes our `apiFetch` client.
  2. **API Endpoint Route:** Inspect [backend/src/modules/tickets/tickets.routes.ts:15-28](backend/src/modules/tickets/tickets.routes.ts#L15-L28). Trace how validation middleware checks fields using Zod models and checks user permissions.
  3. **Repository Persistence:** Inspect [backend/src/modules/tickets/tickets.service.ts:10-47](backend/src/modules/tickets/tickets.service.ts#L10-L47) and [backend/src/modules/tickets/tickets.repository.ts:12-23](backend/src/modules/tickets/tickets.repository.ts#L12-L23) to see the SLA duration assignment and Prisma save.

---

### Block 3: Code Modification Practice (120 Minutes)
- **Goal:** Make a minor but real functional change in the codebase to test understanding of status transitions.
- **Steps:**
  1. Open [backend/src/modules/tickets/ticket-status-machine.ts:1-25](backend/src/modules/tickets/ticket-status-machine.ts#L1-L25).
  2. Modify the rules to allow an direct transition from `OPEN` to `CLOSED` without going through `IN_PROGRESS` if a ticket is marked resolved instantly.
  3. Write a small unit test or test it manually via postman to verify that the change successfully passes status validation.

---

### Block 4: Structural Self-Critique (60 Minutes)
- **Goal:** Read the existing codebase critically to identify trade-offs and structural weaknesses.
- **Steps:**
  1. Review [docsclaude/CRITIQUE.md](CRITIQUE.md) to understand identified anti-patterns and performance risks in this repository.
  2. Walk through the database queries inside [backend/src/modules/tickets/tickets.repository.ts:53-108](backend/src/modules/tickets/tickets.repository.ts#L53-L108) and look for potential N+1 query patterns or missing indexing configurations.
