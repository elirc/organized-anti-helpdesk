# Senior Katas: Advanced System Design & Refactoring

These 10 open-ended Socratic design exercises have no single correct answer. They are designed to develop software design taste and architectural judgment in senior engineers.

---

## Kata 1: High-Availability Tenant Configuration Caching
- **Where to Look:** [backend/src/middleware/tenant.middleware.ts:9-26](backend/src/middleware/tenant.middleware.ts#L9-L26)
- **Context:** Fetching tenant metadata on every request causes high database load. To improve performance, we need to implement a caching strategy.
- **Core Questions:**
  1. If you cache tenant configuration data in an in-memory database like Redis, how do you handle cache invalidation when a tenant's settings update?
  2. What is the impact on request latency if the Redis cluster experiences a network partition? How do you implement a graceful fallback?

---

## Kata 2: Scaling Databases via Read-Write Splits
- **Where to Look:** [backend/src/modules/tickets/tickets.repository.ts:25-50](backend/src/modules/tickets/tickets.repository.ts#L25-L50)
- **Context:** Database query volume is rising. To scale, you decide to implement a read replica database instance.
- **Core Questions:**
  1. How do you refactor the repository layer to direct write queries to the primary database while directing read queries to the replica?
  2. How do you handle read-after-write consistency (replication lag)? What happens if a user updates a ticket status but the subsequent list fetch reads from a replica that has not updated yet?

---

## Kata 3: Asynchronous Event Pipelines
- **Where to Look:** [backend/src/modules/tickets/tickets.service.ts:186-207](backend/src/modules/tickets/tickets.service.ts#L186-L207)
- **Context:** Modifying tickets triggers multiple side-effects (activities, audit logs, email notifications, slack hooks).
- **Core Questions:**
  1. How do you extract these non-core side effects from the request-response thread using an asynchronous message queue (e.g. RabbitMQ or BullMQ)?
  2. How do you handle failure conditions? If a slack notification hook fails to execute, how do you prevent blocking the main ticket status transition while supporting retry policies?

---

## Kata 4: Offline Client-Side Query Queuing
- **Where to Look:** [frontend/src/api/client.ts:25-41](frontend/src/api/client.ts#L25-L41)
- **Context:** Field service agents occasionally lose internet connectivity but still need to submit comments and modify tickets.
- **Core Questions:**
  1. How do you design an offline queue inside the frontend application client layer to store outgoing mutations inside browser IndexDB storage?
  2. How do you handle sync conflicts when connectivity is restored? What happens if an agent submits a ticket status change offline, but the ticket was modified by another agent in the meantime?

---

## Kata 5: High-Performance Virtualized Tables
- **Where to Look:** [frontend/src/features/tickets/pages/TicketListPage.tsx:136-160](frontend/src/features/tickets/pages/TicketListPage.tsx#L136-L160)
- **Context:** Massive enterprise queues render thousands of ticket rows, slowing down the DOM and degrading scrolling framerates.
- **Core Questions:**
  1. How do you integrate virtualized scrolling (e.g. via `react-virtual`) to render only the visible subset of rows?
  2. How do you manage dynamic row heights (e.g. multiline ticket titles) within a virtualized grid without triggering layout thrashing?

---

## Kata 6: Telemetry and Observability Adaption
- **Where to Look:** [backend/src/shared/errors/AppError.ts:1-12](backend/src/shared/errors/AppError.ts#L1-L12)
- **Context:** Debugging production errors requires rich distributed tracing data.
- **Core Questions:**
  1. How do you integrate OpenTelemetry into your Express error adapter pipeline to trace request contexts across multiple downstream services?
  2. How do you filter out sensitive parameters (like passwords or PII) from your trace metadata before shipping logs to your telemetry platform?

---

## Kata 7: Runtime Schema Status Extensions
- **Where to Look:** [backend/src/modules/tickets/ticket-status-machine.ts:1-25](backend/src/modules/tickets/ticket-status-machine.ts#L1-L25)
- **Context:** Instead of hardcoding ticket status lifecycles, enterprise tenants want to define their own custom workflow pipelines at runtime.
- **Core Questions:**
  1. How do you refactor the state machine logic to load allowable transitions dynamically from the database per tenant, while keeping routing checks fast?
  2. How do you protect the system from user-configured loops or dead-ends (e.g. creating a state that can never reach a closed status)?

---

## Kata 8: Micro-Frontend Shared States
- **Where to Look:** [frontend/src/auth/auth.store.ts:20-35](frontend/src/auth/auth.store.ts#L20-L35)
- **Context:** Your organization is adopting micro-frontends. The login session store must be shared across multiple independently-built web apps.
- **Core Questions:**
  1. How do you design a shared state mechanism (e.g. utilizing cross-origin postMessage wrappers or shared localStorage keys) to sync active user credentials across micro-frontend boundaries?
  2. How do you isolate micro-frontends to ensure a security vulnerability in one app cannot access the auth store credentials of another?

---

## Kata 9: Zero-Downtime API Versioning
- **Where to Look:** [backend/src/middleware/validate.middleware.ts:1-18](backend/src/middleware/validate.middleware.ts#L1-L18)
- **Context:** Modifying the ticket schema model risks breaking integrations for customers using legacy mobile app builds.
- **Core Questions:**
  1. How do you design an API versioning strategy (e.g. utilizing URL path routes `/v1/` vs `/v2/` or custom request headers) at the validation middleware layer?
  2. How do you maintain legacy request parsing support on the backend without duplicating controller logic or bloating code branches?

---

## Kata 10: Time-Series Audit Log Partitions
- **Where to Look:** [backend/src/modules/dashboard/dashboard.service.ts:82-103](backend/src/modules/dashboard/dashboard.service.ts#L82-L103)
- **Context:** As audit logs grow to millions of records, querying and aggregating history tables degrades primary database performance.
- **Core Questions:**
  1. How do you migrate historical audit trails to an optimized time-series database or partitioned PostgreSQL tables?
  2. How do you design a reporting pipeline that queries historical data partitions without slowing down the active ticketing system?
