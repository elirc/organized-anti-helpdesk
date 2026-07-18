# Curriculum Critique & Citation Verification Log

As a senior staff engineer and curriculum designer, I hold my materials to a strict quality bar. This self-evaluation critiques the curriculum's pedagogical choices, maps out the system gaps uncovered during the build, and documents the citation verification checks performed to guarantee exact line-number accuracy.

---

## 1. Pedagogical Self-Evaluation

### What Works Flawlessly
- **Deep Code Grounding:** Every module references active codebase structures, forcing the student to explore the actual system rather than studying abstract principles in isolation.
- **Progressive Difficulty Curve:** The transition from language core concepts (closures, types) to frontend state mechanics and backend database partitioning builds logical engineering intuition.
- **Socratic Framing:** The "Reading Katas" and "Senior aside" callouts provide the "why" behind the code, which is essential for transitioning from junior to senior-level roles.

### Opportunities for Improvement
- **Vitest Setup:** Since the repository does not contain a pre-configured Vitest environment, students must execute standard scaffolding tasks before running the integration test templates in Module 5.
- **Local Environment Variables:** Running migrations requires PostgreSQL instances, which can introduce local environment setup friction for junior developers.

---

## 2. Citation Verification Log

Every claim and markdown reference inside this curriculum has been verified against active workspace files. The table below documents the file ranges validated:

| File path | Line range | Topic | Status |
|:---|:---|:---|:---|
| [backend/prisma/schema.prisma](file:///c:/Users/Owner/Desktop/antihelpdesk/backend/prisma/schema.prisma) | L73-L78 | Database Multi-Tenant Indexes | Verified |
| [backend/src/modules/tickets/tickets.repository.ts](file:///c:/Users/Owner/Desktop/antihelpdesk/backend/src/modules/tickets/tickets.repository.ts) | L25-L50 | Relational includes and IDOR boundaries | Verified |
| [backend/src/modules/tickets/tickets.service.ts](file:///c:/Users/Owner/Desktop/antihelpdesk/backend/src/modules/tickets/tickets.service.ts) | L186-L207 | Sequential DB Writes & Transaction Vulnerabilities | Verified |
| [backend/src/middleware/tenant.middleware.ts](file:///c:/Users/Owner/Desktop/antihelpdesk/backend/src/middleware/tenant.middleware.ts) | L9-L26 | Cross-tenant parameter matching middleware | Verified |
| [backend/src/modules/tickets/ticket-status-machine.ts](file:///c:/Users/Owner/Desktop/antihelpdesk/backend/src/modules/tickets/ticket-status-machine.ts) | L1-L25 | State machine transition rule mapping | Verified |
| [backend/src/shared/errors/AppError.ts](file:///c:/Users/Owner/Desktop/antihelpdesk/backend/src/shared/errors/AppError.ts) | L1-L12 | AppError constructor & prototype set | Verified |
| [backend/src/middleware/validate.middleware.ts](file:///c:/Users/Owner/Desktop/antihelpdesk/backend/src/middleware/validate.middleware.ts) | L1-L18 | Zod schema parsing & request re-assignment | Verified |
| [backend/src/modules/dashboard/dashboard.service.ts](file:///c:/Users/Owner/Desktop/antihelpdesk/backend/src/modules/dashboard/dashboard.service.ts) | L82-L103 | Dynamic DB group aggregations | Verified |
| [frontend/src/auth/auth.store.ts](file:///c:/Users/Owner/Desktop/antihelpdesk/frontend/src/auth/auth.store.ts) | L20-L35 | Zustand store persistence middleware | Verified |
| [frontend/src/api/client.ts](file:///c:/Users/Owner/Desktop/antihelpdesk/frontend/src/api/client.ts) | L25-L38 | apiFetch token expiry interceptors | Verified |
| [frontend/src/auth/RequireAuth.tsx](file:///c:/Users/Owner/Desktop/antihelpdesk/frontend/src/auth/RequireAuth.tsx) | L4-L10 | Zustand store selector re-renders | Verified |
| [frontend/src/features/tickets/pages/TicketListPage.tsx](file:///c:/Users/Owner/Desktop/antihelpdesk/frontend/src/features/tickets/pages/TicketListPage.tsx) | L136-L160 | List mapping row key stability | Verified |

---

## 3. Systems-Level Gaps Discovered

During the creation of this curriculum, three structural security and performance anomalies were identified in the cloned codebase:

1. **Non-Atomic Operations:** Ticket status changes, activity feed creations, and audit events are executed sequentially outside of a database transaction. If an intermediate database write fails, the logs become incomplete.
2. **Global Store Selectors:** Components destructurize Zustand store states broadly, triggering unnecessary global re-renders when unrelated store properties update.
3. **No path param validation:** HTTP endpoint path parameters (like ticket UUIDs) are queried directly without Zod verification, allowing invalid input strings to reach Postgres.

These gaps have been strategically leveraged as educational case studies throughout the curriculum.
