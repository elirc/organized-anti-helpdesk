# Module 05 Exercises: Quality Engineering

Verify your software reliability, security, and performance mental models by completing these Socratic and coding exercises.

---

## Exercise 1: Write an Access Control Security Audit

### The Problem
Review the following user profile endpoint implementation. Identify exactly **two** security vulnerabilities in this code and write a patched version of the handler to resolve them:

```typescript
// Illustrative
import { Request, Response } from 'express';
import prisma from '../../db/prisma';

export async function getUserProfile(req: Request, res: Response) {
  const { id } = req.params;
  
  // Vulnerabilities:
  const user = await prisma.user.findFirst({
    where: { id }
  });

  res.status(200).json(user);
}
```

---

## Exercise 2: Diagnose React Rendering Performance

### The Problem
Explain why updating the search filter on a ticket list view causes all rendered rows in the table to re-render. Write down exactly how you would verify this behavior utilizing the Chrome React DevTools Profiler, and describe how to apply `React.memo` or `useDeferredValue` to resolve the performance issue.

---

## Exercise 3: Complete Integration Test Suite

### The Problem
Write a copy-pasteable, complete integration test for `ticketsService.assignTicket` using Vitest and Supertest that validates:
1. Requesters are blocked from assigning tickets.
2. Agents cannot assign a ticket to a user belonging to another organization.
3. Successful ticket assignments create a corresponding ticket activity history record.

---

## Self-Grading Rubric

For each exercise, score yourself honestly from **0 to 3**:

- **0 (Unable to Attempt):** Could not identify the security flaws or write the integration test cases.
- **1 (Partial Understanding):** Correctly identified security flaws but had bugs in the patched handler or wrote an incomplete test suite.
- **2 (Correct with Refactoring):** Resolved both security flaws, outlined React DevTools profiling steps, and wrote a robust integration test with minor reference checks.
- **3 (Flawless Execution):** Patched the security vulnerabilities securely, detailed Chrome React DevTools profiling perfectly, and wrote a robust integration test covering all three assignment conditions and database cleanup hooks flawlessly.
