# Code Reviews: Architectural Mentorship

As a senior engineer, code reviews are your primary tool for mentorship and maintaining code quality. This guide provides 10 code-anchored code reviews, showing typical junior anti-patterns alongside their corresponding senior refactorings.

---

## 1. IDOR Vulnerability in User Queries
- **The Code:** `prisma.user.findUnique({ where: { id } })`
- **Junior Anti-pattern:** Fetching a user record using the ID alone, exposing the endpoint to cross-tenant IDOR attacks.
- **Senior Refactoring:** Ensure database operations are scoped by organization ID:
  [backend/src/modules/tickets/tickets.repository.ts:25-30](backend/src/modules/tickets/tickets.repository.ts#L25-L30)
  ```typescript
  async findById(id: string, organizationId: string): Promise<Ticket | null> {
    return prisma.ticket.findFirst({
      where: {
        id,
        organizationId,
      },
  ```

---

## 2. Dynamic Random Keys in Lists
- **The Code:** `<tr key={Math.random()}>`
- **Junior Anti-pattern:** Assigning dynamic random keys to list rows, forcing React to destroy and recreate the DOM on every render.
- **Senior Refactoring:** Use stable, database-backed identifiers:
  [frontend/src/features/tickets/pages/TicketListPage.tsx:136-146](frontend/src/features/tickets/pages/TicketListPage.tsx#L136-L146)
  ```tsx
  <tbody className="divide-y divide-gray-800/60">
    {data?.data?.map((ticket: any) => {
      return (
        <tr
          key={ticket.id}
  ```

---

## 3. Synchronous File System Operations
- **The Code:** `fs.readFileSync(configPath)`
- **Junior Anti-pattern:** Reading files synchronously inside request handlers, blocking the event loop and halting all concurrent requests.
- **Senior Refactoring:** Load persistent configuration files once during server startup:
  [backend/src/app.ts:1-12](backend/src/app.ts#L1-L12)

---

## 4. Storing Redundant Computed State
- **The Code:** `const [fullName, setFullName] = useState('')`
- **Junior Anti-pattern:** Duplicating state values for variables that can be derived dynamically.
- **Senior Refactoring:** Derive values inline during rendering:
  [frontend/src/features/tickets/pages/TicketListPage.tsx:142-144](frontend/src/features/tickets/pages/TicketListPage.tsx#L142-L144)
  ```typescript
  const slaBreached = new Date(ticket.slaDueAt) < new Date() && ticket.status !== 'RESOLVED';
  ```

---

## 5. Global Store Destructuring
- **The Code:** `const state = useAuthStore()`
- **Junior Anti-pattern:** Importing the entire store globally, causing unnecessary re-renders of the component whenever any store property changes.
- **Senior Refactoring:** Use specific selector functions to import only the required slice of state:
  [frontend/src/auth/RequireAuth.tsx:4-10](frontend/src/auth/RequireAuth.tsx#L4-L10)

---

## 6. Double HTTP Response Sends
- **The Code:** `if (error) res.send(error); res.json(data);`
- **Junior Anti-pattern:** Forgetting to return after sending a response, causing the request to continue executing and crash with "headers already sent" errors.
- **Senior Refactoring:** Always return when sending response headers:
  [backend/src/middleware/error.middleware.ts:5-10](backend/src/middleware/error.middleware.ts#L5-L10)
  ```typescript
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
    });
  }
  ```

---

## 7. Loose Input String Validation
- **The Code:** `priority: z.string()`
- **Junior Anti-pattern:** Permitting loose string values instead of strict database enums, leading to database constraint violations downstream.
- **Senior Refactoring:** Enforce strict validation perimeters using Zod and native enums:
  [backend/src/modules/tickets/tickets.schemas.ts:31-33](backend/src/modules/tickets/tickets.schemas.ts#L31-L33)
  ```typescript
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  ```

---

## 8. Non-Atomic Multi-Write Operations
- **The Code:** `await updateTicket(); await logActivity();`
- **Junior Anti-pattern:** Executing multiple related database mutations sequentially outside of a transaction, leaving the database out of sync if a middle step fails.
- **Senior Refactoring:** Wrap multi-write operations inside transactional blocks:
  [backend/src/modules/tickets/tickets.service.ts:186-207](backend/src/modules/tickets/tickets.service.ts#L186-L207)

---

## 9. Dynamic Date Parameters in Cache Keys
- **The Code:** `queryKey: ['dashboard', new Date()]`
- **Junior Anti-pattern:** Using dynamic timestamps directly inside query keys, causing continuous cache misses since the timestamp is updated on every render.
- **Senior Refactoring:** Use stable hierarchical string segments for cache keys:
  [frontend/src/features/dashboard/DashboardPage.tsx:13-17](frontend/src/features/dashboard/DashboardPage.tsx#L13-L17)
  ```typescript
  const { data: summary } = useQuery({
    queryKey: ['dashboard', 'summary'],
  ```

---

## 10. Missing Custom Error Prototype Alignment
- **The Code:** `class AppError extends Error { constructor() { super(); } }`
- **Junior Anti-pattern:** Creating a custom Error subclass without manually setting the prototype, breaking `instanceof` checks in compiled JS targets.
- **Senior Refactoring:** Manually restore the prototype chain inside constructors:
  [backend/src/shared/errors/AppError.ts:5-10](backend/src/shared/errors/AppError.ts#L5-L10)
  ```typescript
  constructor(message: string, statusCode: number) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
  ```

> **Senior aside:** *Code reviews are about education, not gatekeeping. Always explain the underlying "why" behind your refactoring feedback. Help your team build engineering intuition.*

---

## Pitfall Checklist

1. **Nitpicking style over substance:** Focus on architectural issues, performance bottlenecks, and security flaws rather than spacing styles.
2. **Missing security vulnerabilities:** Approving PRs that contain obvious IDOR access control flaws.
3. **No performance tracing:** Letting unindexed queries or synchronous I/O operations pass code reviews.
4. **Vague feedback:** Writing generic review comments like "fix this" without offering concrete refactoring examples.
5. **Ignoring circular imports:** Approving changes that introduce circular dependency paths.
6. **No test audits:** Merging pull requests without verifying that new features include appropriate test coverage.
7. **Swallowing exception stack traces:** Permitting generic try-catch blocks to pass review.
8. **Underestimating memory growth bounds:** Approving operations that load massive datasets into Node's in-memory array structures.

---

## Drills

1. **Refactor Code Review Comment:** Practice writing a constructive, senior-level code review comment on a PR that contains an IDOR vulnerability, explaining the architectural risk.
2. **circularity Verification:** Analyze the imports inside [backend/src/modules/tickets/tickets.service.ts:1-8](backend/src/modules/tickets/tickets.service.ts#L1-L8) to verify that no circular dependencies are present.
3. **Audit Pull Request:** Review a mock PR locally, check it against your 15-item security pre-merge checklist, and list any violations.
