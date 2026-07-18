# The Systematic Testing Strategy

A junior developer thinks high test coverage equals high quality software, resulting in a bloated test suite that breaks on every minor refactoring. A senior developer focuses on high-leverage testing boundaries, mocking only external integrations while keeping database operations isolated.

---

## 1. The Quality Pyramid Structure

We divide our testing suite into three clean boundaries:

```
+-------------------------------------------------------+
| 1. End-to-End (E2E) Tests (Browser Automation)        |
|    - Validates complete system integration.            |
|    - Uses Playwright to click elements.                |
|    - Slow and expensive; limited to critical flows.   |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
| 2. Integration Tests (HTTP Boundaries & Database)     |
|    - Mounts the actual Express API routing tree.      |
|    - Uses a real PostgreSQL Docker test container.    |
|    - Runs queries using Prisma Client.                |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
| 3. Unit Tests (Pure Logic & State Machines)           |
|    - Focuses on pure functions with no side effects.   |
|    - Instantaneous execution speed.                   |
|    - Perfect for status transitions or SLA calculations.|
+-------------------------------------------------------+
```

---

## 2. Dynamic Unit Testing: Workflow Validation

Unit tests are cheap, fast, and resilient. They are perfect for testing state transitions where inputs and outputs are completely predictable.

Let's study the state machine we want to target:
[backend/src/modules/tickets/ticket-status-machine.ts:1-25](backend/src/modules/tickets/ticket-status-machine.ts#L1-L25)

```typescript
import { TicketStatus } from '@prisma/client';

export const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.WAITING_ON_INTERNAL, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.WAITING_ON_CUSTOMER]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.WAITING_ON_INTERNAL]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.RESOLVED]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [TicketStatus.OPEN] // Reopen path
};

export const canTransition = (from: TicketStatus, to: TicketStatus): boolean => {
  const allowed = TICKET_STATUS_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
};
```
Because `canTransition` is a pure function with no side effects (it does not query the database or call external APIs), we don't need database setups or mock engines to verify it. We can write an instant unit test suite validating every allowed transition pathway.

> **Senior aside:** *Never mock code that you own and control, such as internal database repository classes. Mocking internal interfaces hides integration issues and gives you false confidence while slowing down refactoring efforts.*

---

## Pitfall Checklist

1. **Mocking internal repositories:** Writing mock databases instead of running integration tests against a real test container.
2. **Testing React implementation details:** Asserting on state variable names rather than validating visual DOM elements using user actions.
3. **No transaction cleanup:** Leaving test database states corrupted after test suites execute.
4. **Flaky assertions on dates:** Hardcoding exact date strings in assertions instead of asserting on relative boundaries.
5. **Permitting tests to share state variables:** Running tests sequentially that mutate a shared global database table without resetting it.
6. **Mismatched environments:** Running test suites against production databases, accidentally deleting live data.
7. **Using absolute sleeps in tests:** Adding `await sleep(1000)` instead of using dynamic wait selectors.
8. **Ignoring rejected promise warnings:** Bypassing console warnings during asynchronous test executions.

---

## Drills

1. **State Machine Audit:** Open [backend/src/modules/tickets/ticket-status-machine.ts:1-25](backend/src/modules/tickets/ticket-status-machine.ts#L1-L25) and explain how many test cases are required to cover every possible transition combination.
2. **Design Integration Test Plan:** Outline the steps required to write a full integration test for `ticketsService.createTicket`, including setup and teardown stages.
3. **Trace flaky test conditions:** Create a mock test suite that compares dates and explain why executing it right at midnight could cause it to fail.
