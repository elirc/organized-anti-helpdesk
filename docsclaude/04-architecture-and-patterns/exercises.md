# Module 04 Exercises: Architecture and Patterns

Verify your software design taste and architecture patterns mental models by completing these Socratic and refactoring drills.

---

## Exercise 1: Enforce Strict Layering Boundaries

### The Problem
Review the following controller method. Explain exactly why this violates our layered architecture invariants. Refactor the method to restore strict separation of concerns, moving DB interactions to the repository and business rules to the service layer:

```typescript
// Illustrative
import { Request, Response } from 'express';
import prisma from '../../db/prisma';

export async function quickCloseTicket(req: Request, res: Response) {
  const { id } = req.params;
  
  // Violations list:
  const ticket = await prisma.ticket.findFirst({
    where: { id, organizationId: req.user.organizationId }
  });

  if (!ticket) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }

  if (ticket.priority === 'URGENT') {
    return res.status(400).json({ error: 'Cannot quick close urgent tickets' });
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: { status: 'CLOSED' }
  });

  res.status(200).json(updated);
}
```

---

## Exercise 2: Design a Custom State Transition Guard

### The Problem
Our system status transitions are configured in a workflow state machine:
[backend/src/modules/tickets/ticket-status-machine.ts:1-25](backend/src/modules/tickets/ticket-status-machine.ts#L1-L25)

Write an extension of this machine that adds a new ticket status: `WAITING_ON_THIRD_PARTY`.
Define the allowable transition rules:
1. You can transition to `WAITING_ON_THIRD_PARTY` from `IN_PROGRESS` or `WAITING_ON_INTERNAL`.
2. You can *only* transition from `WAITING_ON_THIRD_PARTY` back to `IN_PROGRESS` or `RESOLVED`.
Write a test block that validates these transitions.

---

## Exercise 3: Audit Trail Integrity Review

### The Problem
Trace how database anomalies (such as deadlocks or pool exhaustion) would affect audit logs under the non-transactional multi-write sequence currently used in [backend/src/modules/tickets/tickets.service.ts:186-207](backend/src/modules/tickets/tickets.service.ts#L186-L207). Contrast the failure modes with a transactional implementation.

---

## Self-Grading Rubric

For each exercise, score yourself honestly from **0 to 3**:

- **0 (Unable to Attempt):** Could not trace layer violations or write state machine rules.
- **1 (Partial Understanding):** Correctly identified layer violations but had compilation errors in refactoring or missed specific transition paths.
- **2 (Correct with Refactoring):** Restored layering successfully and designed the state transition rules but needed to run multiple syntax checks.
- **3 (Flawless Execution):** Refactored the quickClose handler cleanly into controllers, services, and repositories, updated the state machine transitions with zero type errors, and explained transactional failure rollbacks perfectly.
