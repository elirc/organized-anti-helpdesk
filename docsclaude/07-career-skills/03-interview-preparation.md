# Enterprise Interview Preparation: System Design & Coding

Leverage the multi-tenant helpdesk architecture to prepare for mid- and senior-level software engineering interviews. This guide outlines how to present our system architecture in System Design and Coding interview loops.

---

## 1. System Design Interview Strategies

When asked to "Design a Multi-Tenant Ticketing System," structure your answer around the following key architectural areas:

### Topic 1: Multi-Tenant Data Isolation
- **The Question:** "How do you ensure Tenant A cannot read or write data belonging to Tenant B?"
- **The Pitch:** Discuss physical vs. logical isolation. Cite how we implement logical isolation at the query level by including composite indexes on all database queries:
  [backend/src/modules/tickets/tickets.repository.ts:25-30](backend/src/modules/tickets/tickets.repository.ts#L25-L30)
- **Scale-Out Strategy:** Discuss migrating to schema-per-tenant or database-per-tenant architectures for premium enterprise customers who require absolute physical data isolation.

### Topic 2: Compliance & Audit Logs (Non-Repudiation)
- **The Question:** "How do you log security-critical audit trails securely?"
- **The Pitch:** Explain our dual-history model. Discuss transactional rollbacks using Prisma transactions to ensure status modifications and audit trail events are written atomically:
  [backend/src/modules/tickets/tickets.service.ts:186-207](backend/src/modules/tickets/tickets.service.ts#L186-L207)
- **Archiving Plan:** Explain moving historical audit records out of the primary database to dedicated time-series databases to keep active queries fast.

---

## 2. Coding Interview Strategies

Coding interviews evaluate clean code, validation, and performance under constraint. When implementing API endpoints, apply these three core patterns to impress interviewers:

1. **Strict Perimeter Validation:** Never write manual string checks inside controller bodies. Use schema-based parsing (like Zod) at the HTTP entry boundary to clean and transform payloads:
   [backend/src/modules/tickets/tickets.schemas.ts:31-33](backend/src/modules/tickets/tickets.schemas.ts#L31-L33)
2. **Atomic Service Workflows:** Encapsulate operations in a clean Service Layer, keeping database or network specifics decoupled.
3. **Structured Custom Errors:** Return errors using custom subclasses to propagate status codes cleanly without throwing unhandled process crashes:
   [backend/src/shared/errors/AppError.ts:1-12](backend/src/shared/errors/AppError.ts#L1-L12)

> **Senior aside:** *In system design interviews, never propose complex tools (like Kafka or Kubernetes) immediately without justifying why they are needed. Start with a simple, solid database model and scale the architecture incrementally as requirements grow.*

---

## Pitfall Checklist

1. **Failing to ask clarifying questions:** Starting to draw a design before understanding the user volume or traffic scale.
2. **Missing tenant scope constraints:** Bypassing security isolation rules in database design.
3. **No database transaction awareness:** Proposing sequential, non-atomic database writes for financial or auditing systems.
4. **Ignoring database replication lag:** Designing systems that read from replicas immediately after a write without handling sync drift.
5. **No input validation perimeter planning:** Letting raw network strings reach database models.
6. **Hardcoding secrets in designs:** Committing static tokens to codebase examples.
7. **Over-engineering simple CRUD pipelines:** Proposing microservices for simple, low-volume applications.
8. **Ignoring telemetry metrics:** Failing to explain how you monitor the system for health and errors in production.

---

## Drills

1. **System Design Practice:** Draw an architectural diagram of our helpdesk application, detailing every component from the DNS load balancer down to the database replica instances.
2. **Explain Replication Lag:** Write a detailed explanation of replication lag and describe how to solve it in systems where users must read their own updates immediately.
3. **Mock Coding Interview:** Implement a mock `/api/tickets/:id/close` PUT endpoint in under 20 minutes, enforcing strict Zod validation, tenant checks, state transitions, and audit logs.
