# Authentication & Strict Multi-Tenant Isolation

In a multi-tenant SaaS application, data leaks across tenants are the single most severe security threat. A senior engineer designs tenant isolation deep into the architecture, ensuring that every database request is explicitly bounded by tenant identity.

---

## 1. Authentication Boundaries & Token Handling

Our authentication architecture uses standard JSON Web Tokens (JWT) containing cryptographically signed payload structures (user ID, organization ID, and role scope).

Let's examine the token verification process:
[backend/src/middleware/auth.middleware.ts:14-38](backend/src/middleware/auth.middleware.ts#L14-L38)

```typescript
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { organization: true }
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401, 'UNAUTHORIZED');
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }
};
```

---

## 2. Preventing Insecure Direct Object Reference (IDOR) Attacks

An IDOR attack occurs when an attacker modifies a resource identifier (like a ticket UUID) in a request to access data belonging to another tenant.

Let's trace how our codebase blocks IDOR attacks:
[backend/src/modules/tickets/tickets.repository.ts:25-31](backend/src/modules/tickets/tickets.repository.ts#L25-L31)

```typescript
  async findById(id: string, organizationId: string): Promise<Ticket | null> {
    return prisma.ticket.findFirst({
      where: {
        id,
        organizationId,
      },
```

### The Isolation Mechanism
When an API request like `GET /api/tickets/ticket-uuid-1234` is processed:
1. The `req.user` payload contains the authenticated user's `organizationId`.
2. This `organizationId` is passed directly to the repository query layer alongside the requested ticket `id`.
3. Even if the requested `ticket-uuid-1234` is a valid ticket ID inside the database, Postgres will return `null` if it belongs to a different organization.
4. The service layer then throws a `404 Not Found` error, preventing the attacker from even confirming the ticket exists.

---

## 3. Walkthrough: A Cross-Tenant Attack and Where it's Stopped

Imagine an attacker belonging to Organization A (`org-A`) attempts to access a high-priority ticket belonging to Organization B (`org-B`) with ID `ticket-B-999`.

```
Attacker Client (auth token for org-A)
   |
   +---> Sends request: GET /api/tickets/ticket-B-999
            |
            | 1. Request enters router
            v
      [authenticate middleware]
            | -> Successfully validates Attacker's token.
            | -> Sets req.user = { id: 'attacker-id', organizationId: 'org-A' }
            v
      [enforceTenantIsolation middleware]
            | -> Detects request has parameter id but no explicit organizationId parameter.
            | -> Passes execution control to handler.
            v
      [ticketsController.getTicket]
            | -> Invokes ticketsService.getTicket('ticket-B-999', 'org-A', req.user)
            v
      [ticketsRepository.findById]
            | -> Queries database: SELECT * FROM "Ticket" WHERE "id" = 'ticket-B-999' AND "organizationId" = 'org-A'
            | -> Result: null (because ticket-B-999 has organizationId = 'org-B')
            v
      [ticketsService.getTicket]
            | -> Detects ticket is null.
            | -> Throws AppError('Ticket not found', 404)
            v
      [errorMiddleware]
            | -> Intercepts the exception and returns 404 to the Attacker.
            | -> DATA LEAK PREVENTED!
```

> **Senior aside:** *Never write repository queries that look up records by ID alone without filtering by tenant ID (e.g., `where: { id }`). Always pass the active tenant ID down to the query level to build physical isolation barriers.*

---

## Pitfall Checklist

1. **Querying by ID alone:** Doing `prisma.ticket.findUnique({ where: { id } })`, bypassing tenant isolation checking.
2. **Accepting tenant ID from untrusted body payloads:** Allowing users to overwrite the organization scope.
3. **No role checks on user listings:** Exposing administrative user lists to normal requesters.
4. **Storing JWT signing secrets in code repositories:** Bypassing environment variable isolation rules.
5. **No token expiration validation:** Issuing tokens that live indefinitely.
6. **Leaking tenant IDs in public API error tracebacks:** Printing UUID validation traces in responses.
7. **Allowing requesters to read internal notes:** Not filtering comment visibility based on user roles.
8. **Inconsistent token invalidation pipelines:** Permitting refresh tokens to remain valid after user logouts.

---

## Drills

1. **Audit Security Layer:** Open [backend/src/middleware/tenant.middleware.ts:9-26](backend/src/middleware/tenant.middleware.ts#L9-L26) and explain how route parameter tenant mismatch checks operate.
2. **Implement Security Test:** Write an integration test mock payload simulating a cross-tenant request, and assert that the endpoint returns a clean 404 or 403 status code.
3. **Trace JWT payload structure:** Generate an access token by registering a mock workspace and decode it using a JWT decoder tool, inspecting the JSON fields.
