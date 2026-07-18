# Reading Katas: Socratic Code Auditing

Improve your code comprehension by auditing 10 production regions within our codebase. Answer each Socratic question using the files and line numbers cited.

---

## Reading Kata 1: The Tenant Isolation Guard
- **File Anchor:** [backend/src/middleware/tenant.middleware.ts:9-26](backend/src/middleware/tenant.middleware.ts#L9-L26)
- **Socratic Question:** How does this middleware handle cases where a route does not have an explicit `organizationId` parameter? Explain what would happen if a user belonging to Organization A attempted to access a route for Organization B that lacked the tenant check parameter.
- **Rubric (0-3):** 3 requires explaining parameter extraction, token payload comparison, and the fall-through security behavior.

---

## Reading Kata 2: The IDOR Shielding Query
- **File Anchor:** [backend/src/modules/tickets/tickets.repository.ts:25-31](backend/src/modules/tickets/tickets.repository.ts#L25-L31)
- **Socratic Question:** Explain why the query uses `findFirst` and includes both `id` AND `organizationId` in the `where` clause, rather than using `findUnique` with `id` alone.
- **Rubric (0-3):** 3 requires explaining the relational isolation boundary, why `findUnique` on ID bypasses tenant scoping, and how a 404 is triggered.

---

## Reading Kata 3: Sequential Mutating Risk
- **File Anchor:** [backend/src/modules/tickets/tickets.service.ts:186-207](backend/src/modules/tickets/tickets.service.ts#L186-L207)
- **Socratic Question:** Identify the risk associated with executing three separate await operations on different models outside of a database transaction.
- **Rubric (0-3):** 3 requires explaining how a failure in the second or third write leaves the database in an out-of-sync state, violating audit trail completeness.

---

## Reading Kata 4: HTTP Token Interceptor Expiry
- **File Anchor:** [frontend/src/api/client.ts:25-38](frontend/src/api/client.ts#L25-L38)
- **Socratic Question:** Trace what happens in the client-side fetch pipeline when an API call returns a `401 Unauthorized` status code.
- **Rubric (0-3):** 3 requires tracing `logout()`, store token clearing, the thrown `Error`, and potential React crash hazards if uncaught.

---

## Reading Kata 5: List Re-Render Keys
- **File Anchor:** [frontend/src/features/tickets/pages/TicketListPage.tsx:136-160](frontend/src/features/tickets/pages/TicketListPage.tsx#L136-L160)
- **Socratic Question:** Explain why the table row key is set specifically to `ticket.id` rather than using the array index, and discuss the performance impact of this design.
- **Rubric (0-3):** 3 requires detailing how React's reconciliation engine uses keys to identify stable DOM nodes across sorting and pagination cycles.

---

## Reading Kata 6: Error Prototype Chain
- **File Anchor:** [backend/src/shared/errors/AppError.ts:1-12](backend/src/shared/errors/AppError.ts#L1-L12)
- **Socratic Question:** Explain why `Object.setPrototypeOf(this, AppError.prototype)` is necessary inside this custom error class.
- **Rubric (0-3):** 3 requires explaining prototype inheritance in ES5 compilation targets and ensuring `instanceof AppError` works correctly.

---

## Reading Kata 7: State Transition Limits
- **File Anchor:** [backend/src/modules/tickets/ticket-status-machine.ts:1-25](backend/src/modules/tickets/ticket-status-machine.ts#L1-L25)
- **Socratic Question:** Trace the transition pathways to determine if a ticket that has been closed can be transitioned directly back to `IN_PROGRESS`.
- **Rubric (0-3):** 3 requires explaining the status machine mapping rules, showing that a closed ticket must transition to `OPEN` first.

---

## Reading Kata 8: Zustand Global Destructuring
- **File Anchor:** [frontend/src/auth/RequireAuth.tsx:4-10](frontend/src/auth/RequireAuth.tsx#L4-L10)
- **Socratic Question:** Explain why destructuring `accessToken` directly from `useAuthStore()` causes unnecessary re-renders when other user profile details are updated.
- **Rubric (0-3):** 3 requires detailing selector execution boundaries and explaining how specific selector functions prevent re-renders.

---

## Reading Kata 9: Request Param Re-assignment
- **File Anchor:** [backend/src/middleware/validate.middleware.ts:1-18](backend/src/middleware/validate.middleware.ts#L1-L18)
- **Socratic Question:** Why does this validation middleware re-assign `req.body`, `req.query`, and `req.params` to the parsed Zod outputs?
- **Rubric (0-3):** 3 requires explaining Zod's parsing capabilities (such as stripping unregistered query parameters and type coercion).

---

## Reading Kata 10: Dynamic DBMS Aggregations
- **File Anchor:** [backend/src/modules/dashboard/dashboard.service.ts:82-103](backend/src/modules/dashboard/dashboard.service.ts#L82-L103)
- **Socratic Question:** Explain why computing ticket status counts dynamically via `groupBy` is preferred over storing redundant counter columns.
- **Rubric (0-3):** 3 requires detailing concurrency synchronization risks, database caching performance trade-offs, and composite indexes.
