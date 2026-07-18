# Module 02 Exercises: Frontend Architecture & Performance

Verify your client-side architecture mental models by completing these rendering and caching drills.

---

## Exercise 1: Predict the Re-Render

### The Problem
Study the following component. Predict exactly how many times the `TicketRow` component will console.log `"Render TicketRow"` when:
1. The component initially mounts.
2. The user hovers over the row (triggering a local hover state).
3. The parent component updates an unrelated `lastUpdated` time stamp prop.

```tsx
// Illustrative
import React, { useState } from 'react';

interface RowProps {
  id: string;
  title: string;
}

export const TicketRow = React.memo(({ id, title }: RowProps) => {
  const [isHovered, setIsHovered] = useState(false);
  console.log(`Render TicketRow: ${id}`);
  
  return (
    <tr 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td>{title}</td>
    </tr>
  );
});
```

---

## Exercise 2: Optimize Zustand Selectors

### The Problem
Explain why the following component will re-render when a user triggers a login event, even if their `role` property has not changed. Refactor the import to prevent unnecessary updates:

```tsx
// Illustrative
import { useAuthStore } from '../auth/auth.store';

export function AgentNavBar() {
  const { user } = useAuthStore();
  const isAgent = user?.role === 'AGENT';

  return (
    <nav>
      {isAgent ? <button>Agent Queue</button> : <button>General Queue</button>}
    </nav>
  );
}
```

---

## Exercise 3: Cascade Cache Invalidation Design

### The Problem
When an Agent assigns a ticket to another agent:
1. The assigned agent property changes.
2. An activity feed item is added.
3. An audit trail event is logged on the backend.

Trace exactly which Query Cache keys inside [frontend/src/features/tickets/pages/TicketDetailPage.tsx:73-86](frontend/src/features/tickets/pages/TicketDetailPage.tsx#L73-L86) must be invalidated to ensure the detailed page layout reflects the assignee name and lists the new activity event instantly.

---

## Self-Grading Rubric

For each exercise, score yourself honestly from **0 to 3**:

- **0 (Unable to Attempt):** Could not trace the render paths or query cache states.
- **1 (Partial Understanding):** Correctly identified re-renders but missed specific optimizations (such as Zustand selectors).
- **2 (Correct with Refactoring):** Solved the exercises but had to inspect the browser devtools to verify.
- **3 (Flawless Execution):** Successfully answered all drills immediately, explaining the complete react reconciliation flow, selector evaluation, and cache keys.
