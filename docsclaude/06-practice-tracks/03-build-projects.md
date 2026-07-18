# Progressive Build Projects: Architectural Additions

Apply your knowledge to design and implement 5 enterprise-grade architectural modules from scratch. These projects build on the existing codebase.

---

## Project 1: Database-Driven SLA Rules Engine
- **Context:** Organizations require custom SLA limits (e.g., Enterprise tenants require 1-hour resolution on Urgent tickets, while basic tenants get 8 hours).
- **Where to Look:** [backend/src/modules/tickets/sla.service.ts:1-24](backend/src/modules/tickets/sla.service.ts#L1-L24)
- **Requirements:**
  1. Create a new `SlaConfig` model in `schema.prisma` scoped by `organizationId`.
  2. Implement an administrative UI and API route allowing tenant owners to configure custom SLA duration thresholds per priority.
  3. Update `slaService` to query database configurations dynamically during ticket creation instead of relying on hardcoded service rules.

---

## Project 2: Real-Time WebSocket Event Stream
- **Context:** Agents work concurrently inside queues and need instant, real-time feedback when a ticket is assigned, commented on, or resolved, without refreshing the browser.
- **Where to Look:** [backend/src/server.ts:1-7](backend/src/server.ts#L1-L7) & [frontend/src/features/tickets/pages/TicketListPage.tsx](frontend/src/features/tickets/pages/TicketListPage.tsx)
- **Requirements:**
  1. Integrate `socket.io` into the Express backend server process.
  2. Implement tenant-isolated WebSocket rooms. When a user connects, verify their JWT and assign their socket connection to their respective `organizationId` room.
  3. Emit event updates (e.g. `TICKET_UPDATED`) to target rooms.
  4. On the frontend, write a custom hook that listens for WebSocket events and invalidates corresponding TanStack Query caches instantly.

---

## Project 3: Multi-Tenant Attachment Storage Service
- **Context:** Requesters need to upload screenshots and logs when creating tickets. This files must be strictly partitioned by tenant organization bounds.
- **Where to Look:** [backend/prisma/schema.prisma:115-130](backend/prisma/schema.prisma#L115-L130)
- **Requirements:**
  1. Set up a secure uploads folder inside the backend workspace.
  2. Implement a `/tickets/:id/attachments` POST endpoint that uses `multer` to process multipart form uploads.
  3. Validate file types (e.g. images and PDFs only) and restrict size to a maximum of 5MB.
  4. Save file metadata to the `Attachment` table, scoping all subsequent lookups by `organizationId`.
  5. Implement a download endpoint that verifies the requester has active permissions to read the parent ticket before streaming the file.

---

## Project 4: Custom Hostname Domain Mapper
- **Context:** Enterprise tenants want to access their portal using a custom domain (e.g. `support.tenantA.com`) rather than a generic slug prefix (e.g. `app.helpdesk.com/tenantA`).
- **Where to Look:** [backend/src/middleware/tenant.middleware.ts:9-26](backend/src/middleware/tenant.middleware.ts#L9-L26)
- **Requirements:**
  1. Add a unique `customDomain` nullable string field to the `Organization` table.
  2. Update the tenant-resolution middleware to inspect incoming HTTP headers (`req.headers.host`).
  3. If a request is received on a mapped custom domain, query the organization by domain and resolve the active tenant context automatically.
  4. Update client-side routing to support domain-based layouts.

---

## Project 5: Fine-Grained Database-Driven RBAC Engine
- **Context:** Static roles are too rigid. Enterprise organizations want to create custom roles (e.g., "Level 2 Support") and assign specific granular permissions.
- **Where to Look:** [backend/src/shared/utils/permissions.ts:1-25](backend/src/shared/utils/permissions.ts#L1-L25)
- **Requirements:**
  1. Create `Role`, `Permission`, and `RolePermission` models in `schema.prisma` scoped by `organizationId`.
  2. Replace static helpers in the permission middle-layer with dynamic database role and permission lookups.
  3. Implement an administrative permission control dashboard, allowing administrators to modify role-permission mappings.
  4. Optimize performance by caching active permission sets in the server's session payload to avoid database lookups on every request.
