# Design Patterns Catalog: Structural Blueprints

A senior engineer recognizes patterns immediately across codebases. This catalog lists the 10 foundational design patterns implemented inside our helpdesk application. Use these patterns to keep code uniform and maintainable as the system expands.

---

## 1. Workflow State Machine Pattern
- **Where:** [backend/src/modules/tickets/ticket-status-machine.ts:1-25](backend/src/modules/tickets/ticket-status-machine.ts#L1-L25)
- **Why:** Centralizes state transitions for dynamic models. Restricts invalid status flows (e.g. going directly from `OPEN` to `CLOSED` without resolving).
- **When:** Use whenever a model has states that must progress along a strict, predictable lifecycle path.

---

## 2. Repository Pattern
- **Where:** [backend/src/modules/tickets/tickets.repository.ts:11-143](backend/src/modules/tickets/tickets.repository.ts#L11-L143)
- **Why:** Decouples direct database driver or ORM references from the business logic. Houses complex query joins and indexing logic.
- **When:** Use for all database access to keep models swappable and isolate database library dependencies.

---

## 3. Service Layer Pattern
- **Where:** [backend/src/modules/tickets/tickets.service.ts:9-285](backend/src/modules/tickets/tickets.service.ts#L9-L285)
- **Why:** Acts as the single source of truth for business rules, coordination of multiple repository calls, validation constraints, and side effects.
- **When:** Use to encapsulate core business transactions, keeping them separate from HTTP or WebSocket protocols.

---

## 4. DTO Validation Perimeter Pattern
- **Where:** [backend/src/modules/tickets/tickets.schemas.ts:4-51](backend/src/modules/tickets/tickets.schemas.ts#L4-L51)
- **Why:** Enforces strong type validation contracts at the outer edge of the application, parsing payloads before execution.
- **When:** Use on all incoming network requests to fail fast and protect internal systems from invalid parameters.

---

## 5. Decoupled Controller Pattern
- **Where:** [backend/src/modules/tickets/tickets.controller.ts:9-81](backend/src/modules/tickets/tickets.controller.ts#L9-L81)
- **Why:** Connects HTTP routes to backend business services. Extracts URL params, translates headers, and formats JSON outputs.
- **When:** Use to bind routing engines to service methods without leaking transport details downstream.

---

## 6. Token-Based Stateless Authentication Middleware
- **Where:** [backend/src/middleware/auth.middleware.ts:14-38](backend/src/middleware/auth.middleware.ts#L14-L38)
- **Why:** Intercepts incoming requests to extract and verify JWT signatures, loading the authenticated user context securely.
- **When:** Use to protect API routes and establish identity bounds before executing controller methods.

---

## 7. Cross-Cutting Tenant Isolation Filter
- **Where:** [backend/src/middleware/tenant.middleware.ts:9-26](backend/src/middleware/tenant.middleware.ts#L9-L26)
- **Why:** Protects routes by validating that any requested `organizationId` parameter strictly matches the authenticated user's organization.
- **When:** Use to prevent cross-tenant data tampering at the middleware layer.

---

## 8. Express Async Handler Wrapper
- **Where:** [backend/src/shared/utils/asyncHandler.ts:1-7](backend/src/shared/utils/asyncHandler.ts#L1-L7)
- **Why:** Wraps asynchronous controller methods, catching rejected Promises and forwarding exceptions to the global error middleware.
- **When:** Use to prevent unhandled promise rejections on Express routing setups.

---

## 9. Global Exception Mapping Adapter
- **Where:** [backend/src/middleware/error.middleware.ts:4-17](backend/src/middleware/error.middleware.ts#L4-L17)
- **Why:** Maps application-level errors to correct HTTP status codes while masking unexpected system crashes behind a safe 500 error payload.
- **When:** Use at the final endpoint of the routing pipeline to sanitize API errors.

---

## 10. Zustand State Store Slice Pattern
- **Where:** [frontend/src/auth/auth.store.ts:20-35](frontend/src/auth/auth.store.ts#L20-L35)
- **Why:** Manages client-side session states outside React component files, rendering UI elements efficiently using selectors.
- **When:** Use for high-frequency, global client-only states that live across navigation transitions.

---

## Recognizing Patterns in Unfamiliar Code

To identify design patterns in an unfamiliar codebase, trace the **dependency imports** and the **lifecycle of a single request**.
- If you see folder splits like `/routes`, `/controllers`, `/services`, and `/repositories`, you are looking at a layered architecture.
- If you notice objects exposing boolean check methods like `canTransitionTo`, you are looking at a state machine.
- If database operations are localized in files ending in `.repository.ts`, the repository pattern is in use.

> **Senior aside:** *Consistency is the hallmark of great engineering. When writing new features, never invent custom structures if a standard, established pattern already exists in the codebase. Align with the patterns already set.*

---

## Pitfall Checklist

1. **Creating unnecessary design layers:** Adding abstractions (like repositories) for simple operations that never scale, bloating the codebase.
2. **State machine state leaks:** Mutating model states inline instead of executing them through the state machine.
3. **Mismatched controller methods:** Writing raw SQL queries inside controllers, violating layer boundaries.
4. **Circularity in services:** Creating services that import each other, locking the garbage collector.
5. **No validation wrapper bounds:** Letting unvalidated query strings reach database layers.
6. **Hardcoding JWT secrets in code pools:** Compromising signing credentials.
7. **Allowing cross-tenant route accesses:** Bypassing tenant-isolation middleware checks.
8. **Inconsistent response formats:** Mixing raw database arrays with nested JSON wrappers across endpoints.

---

## Drills

1. **Identify the State Pattern:** Open [backend/src/modules/tickets/ticket-status-machine.ts:1-25](backend/src/modules/tickets/ticket-status-machine.ts#L1-L25) and trace how the allowable status pathways prevent a ticket from reverting once closed.
2. **Pattern Refactoring:** Design a mock `OrganizationRepository` pattern interface, detailing CRUD methods that enforce tenant isolation invariants.
3. **Trace Route Pipeline:** Trace an API call to `GET /api/dashboard/summary` across all 10 cataloged patterns, noting where each pattern interacts with the request.
