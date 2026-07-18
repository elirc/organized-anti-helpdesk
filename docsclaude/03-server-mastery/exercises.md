# Module 03 Exercises: Server and Backend Mastery

Verify your backend server and database layer mental models by completing these Socratic and coding exercises.

---

## Exercise 1: Write a Tenant Enforcer Middleware

### The Problem
Write a custom Express middleware `enforceStrictTenant` that:
1. Validates that `req.user` exists (populated by `authenticate`).
2. Inspects `req.query` and `req.body`.
3. If an `organizationId` parameter is present in either, validates that it strictly matches `req.user.organizationId`.
4. If a mismatch occurs, immediately passes a `403 Forbidden` `AppError` to the global handler.

Compare your implementation with the real codebase solution at:
[backend/src/middleware/tenant.middleware.ts:9-26](backend/src/middleware/tenant.middleware.ts#L9-L26)

---

## Exercise 2: Diagnose the N+1 Query Threat

### The Problem
Study the following mock dashboard aggregator method. Explain why it is a severe performance bottleneck and how to refactor it utilizing Prisma `groupBy` aggregates to run in a single optimized database query:

```typescript
// Illustrative
async function getTicketsStats(organizationId: string) {
  const tickets = await prisma.ticket.findMany({
    where: { organizationId }
  });

  // N+1 Query Threat:
  const resolvedCounts = await Promise.all(
    tickets.map(async (t) => {
      return prisma.ticketActivity.count({
        where: { ticketId: t.id, action: 'STATUS_CHANGED' }
      });
    })
  );

  return resolvedCounts;
}
```

---

## Exercise 3: Cross-Tenant Breach Simulation

### The Problem
Trace how a malicious actor could attempt to fetch the comment feed of a private ticket belonging to another tenant via [backend/src/modules/comments/comments.routes.ts:1-15](backend/src/modules/comments/comments.routes.ts#L1-L15) and explain at which exact line in `comments.service.ts` or repository layers the database blocks the query.

---

## Self-Grading Rubric

For each exercise, score yourself honestly from **0 to 3**:

- **0 (Unable to Attempt):** Could not write the middleware or identify the N+1 query patterns.
- **1 (Partial Understanding):** Wrote the middleware but missed query parameters, or had partial logic.
- **2 (Correct with Refactoring):** Arrived at the correct implementation and identified Prisma aggregate optimizations but needed reference materials.
- **3 (Flawless Execution):** Wrote a highly robust tenant middleware, proposed an elegant `groupBy` Prisma optimization, and traced the exact cross-tenant database isolation bounds perfectly.
