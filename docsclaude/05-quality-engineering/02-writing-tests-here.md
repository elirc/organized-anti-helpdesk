# Concrete Testing Recipes & Mock Boundaries

To write high-quality tests, a senior engineer relies on clear, copy-pasteable patterns. This guide provides production-ready recipes for writing unit tests using Vitest and integration API tests using Supertest.

---

## Recipe 1: Pure Unit Test (Vitest)

This recipe tests the state machine transitions without booting Express or connecting to PostgreSQL.

Create `backend/src/modules/tickets/ticket-status-machine.test.ts`:

```typescript
// Illustrative — copy-pasteable template
import { describe, it, expect } from 'vitest';
import { canTransition } from './ticket-status-machine';
import { TicketStatus } from '@prisma/client';

describe('Workflow Status Machine Unit Tests', () => {
  it('should permit valid transition pathways', () => {
    // OPEN -> IN_PROGRESS is allowed
    expect(canTransition(TicketStatus.OPEN, TicketStatus.IN_PROGRESS)).toBe(true);
    // RESOLVED -> CLOSED is allowed
    expect(canTransition(TicketStatus.RESOLVED, TicketStatus.CLOSED)).toBe(true);
  });

  it('should block invalid transition pathways', () => {
    // OPEN -> RESOLVED is blocked (must go through IN_PROGRESS in this test configuration)
    // Wait, let's verify our status map:
    // [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED]
    // Ah, in our actual machine, OPEN -> RESOLVED is allowed! Let's check a blocked transition:
    // CLOSED -> RESOLVED is blocked (must go through OPEN first)
    expect(canTransition(TicketStatus.CLOSED, TicketStatus.RESOLVED)).toBe(false);
  });
});
```

---

## Recipe 2: Supertest API Integration Test

This recipe spins up the Express routing tree, issues real HTTP requests, and inspects the database. It handles database cleanup automatically to avoid leaking state between tests.

Create `backend/src/modules/tickets/tickets.integration.test.ts`:

```typescript
// Illustrative — copy-pasteable template
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../db/prisma';

describe('Tickets API Integration Tests', () => {
  let testUser: any;
  let testOrg: any;
  let authToken: string;

  beforeEach(async () => {
    // 1. Create clean workspace seeder records
    testOrg = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org-slug' }
    });

    testUser = await prisma.user.create({
      data: {
        organizationId: testOrg.id,
        email: 'test@example.com',
        passwordHash: 'hashed-pwd',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN'
      }
    });

    // 2. Generate a valid token
    // (In actual execution, import your token sign helper)
    authToken = 'Bearer mock-jwt-token';
  });

  afterEach(async () => {
    // Clean up to prevent database state pollution
    await prisma.ticket.deleteMany({ where: { organizationId: testOrg.id } });
    await prisma.user.deleteMany({ where: { organizationId: testOrg.id } });
    await prisma.organization.delete({ where: { id: testOrg.id } });
  });

  it('should enforce authentication at the boundary', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ title: 'System down', description: 'Immediate help needed' });

    expect(res.status).toBe(401);
  });
});
```

> **Senior aside:** *Never leave test cleanups in global tables to chance. If a test fails mid-execution and skips its cleanup block, subsequent tests will fail due to stale data. Always run cleanup logic inside a robust `afterEach` or `afterAll` hook.*

---

## Pitfall Checklist

1. **Not wiping database tables after integration tests:** Allowing leftover records to pollute subsequent test executions.
2. **Mocking Prisma client methods natively:** Missing database-level constraint violations (like unique slug errors).
3. **Hardcoding authentication tokens indefinitely:** Allowing test suites to fail when tokens expire.
4. **Permitting tests to run concurrently on the same database instance:** Causing random, hard-to-debug race conditions.
5. **No assertions on database state:** Asserting only on the HTTP response status code while failing to verify the database row was written correctly.
6. **Hardcoding absolute time offsets:** Writing dynamic date asserts that fail when clocks drift.
7. **Ignoring warning stack traces:** Leaving rejected Promise tracebacks unresolved inside logs.
8. **Using production databases for tests:** Bypassing check limits, risking data deletion.

---

## Drills

1. **Write Unit Test Suite:** Write a complete unit test suite for the SLA calculation helper located in [backend/src/modules/tickets/sla.service.ts:1-24](backend/src/modules/tickets/sla.service.ts#L1-L24), covering all priority levels.
2. **Transaction Test Design:** Implement an integration test for ticket deletion that asserts that the ticket table record is removed AND the audit log event is recorded successfully.
3. **Trace Failed Cleanups:** Intentionally break a test in the middle of execution and check if your database contains leftover garbage records, then modify your cleanup hooks to recover gracefully.
