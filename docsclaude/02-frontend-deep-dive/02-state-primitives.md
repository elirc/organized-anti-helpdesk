# React State Primitives & Lifecycle Constraints

To construct stable components, a senior engineer must understand the internal constraints of React's state hooks, how batching works, and when to use state vs. references.

---

## 1. Local State Hooks Constraints

React states created via `useState` are immutable. When you trigger the state updater function, you queue a re-render. Inside the current execution frame, the state variable value **remains constant** until the next function invocation.

Let's study local state declaration inside our detailed ticket view:
[frontend/src/features/tickets/pages/TicketDetailPage.tsx:21-27](frontend/src/features/tickets/pages/TicketDetailPage.tsx#L21-L27)

```typescript
  const [commentBody, setCommentBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
```

### The Async Update Trapping
Consider a hypothetical method modifying states:
```typescript
// Illustrative — not from the repo
const handleToggleNote = () => {
  setIsInternal(!isInternal);
  console.log(isInternal); // Logs the OLD state value, not the updated one!
};
```
Because React schedules the state update to be processed on the next render cycle, any immediate synchronous access yields the prior value. If you need the new value immediately, you must compute it locally: `const nextValue = !isInternal; setIsInternal(nextValue); doSomething(nextValue);`.

> **Senior aside:** *Never store values in useState that are purely intended to track internal references without triggering re-renders (like timers or websocket sockets). Use `useRef` instead to store mutable data that lives across renders without triggering a visual component update.*

---

## 2. Automatic State Batching

In React 18+, multiple state updates triggered inside promises, setTimeout blocks, or native event handlers are grouped automatically into a single commit cycle.

```typescript
// Illustrative
const handleTransition = () => {
  setTransitionLoading(true);
  // Perform network call
  setTransitionLoading(false);
  setIsInternal(false);
  // Both updates are batched into a single render cycle, preventing visual layout flickering!
};
```

---

## Pitfall Checklist

1. **Reading state instantly after setting it:** Assuming `setCount(5)` immediately modifies the `count` variable.
2. **Storing redundant computed data in state:** Storing `fullName` in state rather than deriving it: `const fullName = `${first} ${last}``.
3. **Missing dependency array updates:** Stale closures inside state callback setters.
4. **Triggering state changes inside rendering loops:** Causing infinite render loop execution.
5. **Not using functional state updaters:** Doing `setCount(count + 1)` in quick succession instead of `setCount(prev => prev + 1)`.
6. **Passing large object structures to state without shallow updates:** Overwriting rather than merging.
7. **Using state where refs are appropriate:** Storing continuous values like scroll indexes in state, causing performance degradation.
8. **Inconsistent state splits:** Having 10 separate state hooks instead of combining them into a logical single object hook.

---

## Drills

1. **Verify State Updates:** Open [frontend/src/features/tickets/pages/TicketDetailPage.tsx:88-100](frontend/src/features/tickets/pages/TicketDetailPage.tsx#L88-L100) and explain how comments state invalidation updates other layout cards.
2. **Refactor state hooks:** Combine the separate loading indicators inside `TicketDetailPage` into a single `loadingState` record and trace the changes.
3. **UseRef Conversion:** Create a mock component that keeps track of the number of API attempts using `useRef` and explain why this is more efficient than using `useState`.
