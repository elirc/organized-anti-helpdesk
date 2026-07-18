# Progressive Coding Tickets: System Modifications

Complete these 10 real-world ticketing exercises to master the helpdesk codebase. The tracks progress from Easy to Expert.

---

## Easy Tickets

### Ticket 1: Custom Character Limit on Titles
- **Context:** Admins request that ticket titles have a minimum length of 5 characters and a maximum length of 100 characters to prevent spam.
- **Where to Look:** [backend/src/modules/tickets/tickets.schemas.ts:4-13](backend/src/modules/tickets/tickets.schemas.ts#L4-L13)
- **Requirements:**
  1. Modify the `createTicketSchema` schema to enforce these character limits.
  2. Verify that creating a ticket with a 3-character title returns a `400 Bad Request` validation error.

### Ticket 2: Visual Styling for Resolved Statuses
- **Context:** Agents find it difficult to distinguish resolved tickets from active ones in the list layout.
- **Where to Look:** [frontend/src/features/tickets/pages/TicketListPage.tsx:136-160](frontend/src/features/tickets/pages/TicketListPage.tsx#L136-L160)
- **Requirements:**
  1. Add a custom visual badge color style for the `RESOLVED` status column in the table layout.
  2. Ensure it does not affect loading or rendering performance.

---

## Medium Tickets

### Ticket 3: Mandatory Notes for Assignments
- **Context:** Managers want agents to supply a brief explanation (minimum 10 characters) whenever a ticket is assigned to another agent.
- **Where to Look:** [backend/src/modules/tickets/tickets.service.ts:212-230](backend/src/modules/tickets/tickets.service.ts#L212-L230)
- **Requirements:**
  1. Update `assignTicketSchema` to require a `note` string field.
  2. Update the service logic to save this note inside the corresponding `TicketActivity` changelog record.

### Ticket 4: Dynamic Comment Sorting Toggle
- **Context:** Requesters want to read comments chronologically, while agents want to see the newest comments first.
- **Where to Look:** [frontend/src/features/tickets/pages/TicketDetailPage.tsx:32-47](frontend/src/features/tickets/pages/TicketDetailPage.tsx#L32-L47)
- **Requirements:**
  1. Add a toggle button to the top of the comment feed component.
  2. Store the sort state (`asc` or `desc`) locally in the component, updating the rendering order accordingly.

### Ticket 5: Log Description Modifications in History
- **Context:** Customers sometimes edit ticket descriptions, and agents need to trace exactly what details were changed.
- **Where to Look:** [backend/src/modules/tickets/tickets.service.ts:160-185](backend/src/modules/tickets/tickets.service.ts#L160-L185)
- **Requirements:**
  1. Track description modifications in the ticket update service.
  2. Write a corresponding record to `TicketActivity` whenever a ticket's description is modified, saving both old and new descriptions.

---

## Hard Tickets

### Ticket 6: Soft-Delete Tickets Feature
- **Context:** Requesters occasionally create duplicate tickets, but deleting them permanently breaks auditing history.
- **Where to Look:** [backend/prisma/schema.prisma:46-78](backend/prisma/schema.prisma#L46-L78)
- **Requirements:**
  1. Add a `deletedAt` DateTime field to the `Ticket` model.
  2. Update the repository layers to only return records where `deletedAt` is null.
  3. Implement a soft-delete method that sets the current timestamp instead of executing a SQL DELETE command.

### Ticket 7: Integrate WAITING_ON_THIRD_PARTY Status
- **Context:** Complex tickets require feedback from external vendors. We need a way to track this state.
- **Where to Look:** [backend/src/modules/tickets/ticket-status-machine.ts:1-25](backend/src/modules/tickets/ticket-status-machine.ts#L1-L25)
- **Requirements:**
  1. Add `WAITING_ON_THIRD_PARTY` to the database status enums.
  2. Define status transition rules allowing updates to and from this status.
  3. Update front-end dropdowns and status colors to support the new state.

### Ticket 8: strict Tenant Param Interceptor Middleware
- **Context:** Ensure security by intercepting all route path params (`organizationId`) at the middleware layer.
- **Where to Look:** [backend/src/middleware/tenant.middleware.ts:9-26](backend/src/middleware/tenant.middleware.ts#L9-L26)
- **Requirements:**
  1. Extract `organizationId` from URL route parameters.
  2. Compare it with the active `req.user.organizationId` populated by authentication middleware.
  3. Block execution with a `403 Forbidden` error if a mismatch is detected.

---

## Expert Tickets

### Ticket 9: Atomic Status Transactions
- **Context:** Ensure absolute audit consistency by wrapping status changes in transactions.
- **Where to Look:** [backend/src/modules/tickets/tickets.service.ts:186-207](backend/src/modules/tickets/tickets.service.ts#L186-L207)
- **Requirements:**
  1. Refactor status changes to run inside a single `prisma.$transaction` block.
  2. Ensure any single failure (such as writing history or logging audit logs) rolls back the entire ticket status update.

### Ticket 10: JWT Access Token Rotation
- **Context:** Enhance security by rotating access tokens and validating refresh tokens.
- **Where to Look:** [backend/src/modules/auth/auth.service.ts:11-35](backend/src/modules/auth/auth.service.ts#L11-C35)
- **Requirements:**
  1. Store refresh tokens securely in the database with strict expiration dates.
  2. Implement an `/auth/refresh` endpoint that issues new access tokens upon receiving a valid, unexpired refresh token.
  3. Revoke all active refresh tokens for a user during password change events.
