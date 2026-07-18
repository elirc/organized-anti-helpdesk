# Production Security & Pre-Merge Checklist

A senior engineer treats security as a fundamental requirement, not a checkbox. In web applications, data boundaries must be strictly isolated to prevent security threats. This document maps the OWASP Top 10 to our TypeScript stack and provides a 15-item pre-merge security checklist.

---

## 1. OWASP Top 10 Mappings for Express & React

### A1: Broken Access Control (IDOR)
- **The Threat:** Malicious actors attempt to access other tenants' database rows by guessing random UUID keys.
- **Where it is stopped:** In our repository queries by explicitly filtering all operations using the organization ID:
  [backend/src/modules/tickets/tickets.repository.ts:25-30](backend/src/modules/tickets/tickets.repository.ts#L25-L30)
  ```typescript
  async findById(id: string, organizationId: string): Promise<Ticket | null> {
    return prisma.ticket.findFirst({
      where: {
        id,
        organizationId,
      },
  ```

### A2: Cryptographic Failures
- **The Threat:** Storing passwords as plain text in the database.
- **Where it is stopped:** In the service layer during registration by utilizing bcrypt to securely hash passwords before saving:
  [backend/src/modules/auth/auth.service.ts:40-45](backend/src/modules/auth/auth.service.ts#L40-L45)
  ```typescript
  const passwordHash = await bcrypt.hash(data.password, 10);
  ```

### A3: Injection (SQLi & XSS)
- **The Threat:** Attacking the database by inserting SQL commands into user inputs, or triggering scripts on clients via raw HTML.
- **Where it is stopped:**
  - **SQLi:** Prisma automatically parameterizes all queries, rendering injection input characters inert.
  - **XSS:** React automatically escapes all variables rendered in JSX templates.

---

## 2. 15-Item Pre-Merge Security Checklist

Before merging any Pull Request into `main`, verify the following invariants:

- [ ] **1. No IDOR vulnerabilities:** All SQL/Prisma operations on tickets, comments, or users filter explicitly by `organizationId`.
- [ ] **2. No raw queries:** No unparameterized raw SQL lookups are executed in repository files.
- [ ] **3. Input Sanitization:** All request fields (body, query, params) are validated using strict Zod schemas.
- [ ] **4. Hashed credentials:** Passwords are never written or logged in plain text.
- [ ] **5. Access Token lifespan:** JWT access token expirations are short-lived.
- [ ] **6. No password leaks:** User repository response selections explicitly exclude password hash fields: `select: { id: true, email: true }`.
- [ ] **7. Role limits on internal notes:** Normal requesters are strictly blocked from reading or writing internal ticket comments.
- [ ] **8. Safe HTML rendering:** No raw HTML rendering using `dangerouslySetInnerHTML` is present in JSX components without sanitation.
- [ ] **9. CORS scoping:** API origin domains are strictly scoped, preventing open cross-domain accesses.
- [ ] **10. Safe imports:** No third-party packages with known security alerts are imported.
- [ ] **11. Clean log metadata:** No access tokens or passwords are written to server or console logs.
- [ ] **12. Zero database seed credentials:** No default administrative credentials are committed to production migration files.
- [ ] **13. Robust error masks:** Database engine connection parameters are never returned inside HTTP client error responses.
- [ ] **14. Environment variable storage:** Secrets (like JWT keys) are read exclusively from environment variables, never hardcoded.
- [ ] **15. workflow transition checks:** Status modifications are validated through the state transition machine.

> **Senior aside:** *Security is defined by your weakest link. A single endpoint querying a record by ID alone (without tenant filtering) can expose your entire multi-tenant database to hackers.*

---

## Pitfall Checklist

1. **Querying database by resource ID alone:** Bypassing tenant scope filtering.
2. **Accepting organizationId parameters from untrusted request bodies:** Allowing attackers to spoof organizations.
3. **Leaking hashed passwords in user endpoints:** Forgetting to exclude `passwordHash` in SELECT queries.
4. **Committing `.env` configs to Git repositories:** Exposing system secrets to version control.
5. **Permitting requesters to view internal notes:** Not verifying user roles before fetching timeline details.
6. **No input character size bounds:** Permitting massive string payloads that trigger memory exhaustion.
7. **Using weak cryptography:** Hashing passwords with legacy MD5 or SHA1 algorithms.
8. **Hardcoding JWT signature secrets:** Bypassing environment security config controls.

---

## Drills

1. **Audit Auth Middle-layer:** Open [backend/src/middleware/auth.middleware.ts:14-38](backend/src/middleware/auth.middleware.ts#L14-L38) and explain how inactive users are prevented from making API requests.
2. **Write Security Test:** Design an integration test that logs in as a Requester and attempts to fetch an administrative dashboard summary, asserting a `403 Forbidden` status.
3. **Trace XSS Protections:** Write a mock text input on the frontend, type `<script>alert('hack')</script>` into it, and verify that React renders it as harmless plain text.
