# Performance Thinking: Measure First, Optimize Second

A junior developer optimizes premature areas by writing complex algorithms that make the codebase unreadable, without measuring where the system bottlenecks reside. A senior developer measures performance across three distinct surfaces: bundle dimensions, render iterations, and database execution cycles.

---

## 1. The Three Domains of Performance

Performance work is useless without baseline metrics. We audit three different profiles:

### Surface 1: Bundle Sizes (Asset Delivery)
- **Problem:** Heavy client bundles delay initial page renders.
- **Metric:** Time to Interactive (TTI) or Bundle Weight.
- **Solution:** Code-split route boundaries using `React.lazy()` and dynamic imports, keeping base bundles thin.

### Surface 2: Component Render Frequency (React Reconciliation)
- **Problem:** Unnecessary re-renders lag the user interface.
- **Metric:** Framerate (FPS) under interaction.
- **Solution:** Optimize Zustand store selectors and apply `React.memo` to heavy list rows.

### Surface 3: Database Query Latency (DBMS Execution)
- **Problem:** API response delays due to slow database reads.
- **Metric:** Database execution time (measured in milliseconds).
- **Solution:** Add compound database indexes and pipeline independent queries concurrently.

---

## 2. Auditing Zustand Selector Rendering Boundaries

Let's look at the route authentication wrapper:
[frontend/src/auth/RequireAuth.tsx:4-10](frontend/src/auth/RequireAuth.tsx#L4-L10)

```typescript
export default function RequireAuth() {
  const { accessToken } = useAuthStore();
  const location = useLocation();

  if (!accessToken) {
```

### The Performance Vulnerability
In the code above, the component destructurizes the store state: `const { accessToken } = useAuthStore()`.
Because we aren't using a specific selector function, React re-renders `RequireAuth` every time *any* property in `useAuthStore` changes (e.g. updating the active `user` profile data), even if `accessToken` remains identical.

### The Optimal Selector Alternative
To isolate the component from unrelated state changes, select only the required token field:
```typescript
// Illustrative
const accessToken = useAuthStore((state) => state.accessToken);
```
Now, changes to `state.user` are ignored by the wrapper, saving reconciliation overhead.

> **Senior aside:** *Never write memoizations or apply `useMemo` blindly without measuring rendering cycles first. Premature memoization adds memory overhead and increases complexity, which can sometimes degrade performance rather than improving it.*

---

## Pitfall Checklist

1. **Premature optimization:** Writing complex code optimizations without establishing performance baselines.
2. **Global store destructuring:** Triggering massive re-render waterfalls by avoiding specific selector functions.
3. **Missing pagination boundaries:** Querying entire database tables rather than using paginated query limits.
4. **Synchronous JSON parses on massive payloads:** Blocking the Node main thread by parsing multi-megabyte JSON arrays synchronously.
5. **No network compression:** Shipping static assets without gzip or brotli encodings.
6. **Un-indexed database filters:** Searching non-indexed database fields.
7. **Passing anonymous arrow functions as props:** Defeating React reconciliation by recreating function instances on every render.
8. **Heavy calculations inside component render bodies:** Re-running complex filters on every single render cycle instead of wrapping them in `useMemo`.

---

## Drills

1. **Identify Selector Bloat:** Review [frontend/src/layout/Sidebar.tsx:10-25](frontend/src/layout/Sidebar.tsx#L10-L25) and explain how selector functions keep this layout isolated from user credential changes.
2. **Implement React.lazy:** Refactor a mock router structure locally to lazy-load the Dashboard component, splitting it into a separate chunk.
3. **Database Performance audit:** Run `EXPLAIN` on a database search query to see if Postgres uses a fast Index Scan or falls back to a slow Sequential Scan.
