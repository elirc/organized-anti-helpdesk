# Server State & Cache Invalidation with TanStack Query

A senior engineer treats server data as a temporary local cache. Instead of manually copying fetched payloads into global Zustand stores, they use query caches to manage stale lifecycles, background updates, and invalidations.

---

## 1. The Query Key Dependency Array

TanStack Query uses the `queryKey` array as a unique key to identify and cache datasets. If a query key includes parameters (like page numbers or filter statuses), TanStack Query automatically executes new fetches when any parameter changes, acting like a React dependency array.

Let's study ticket pagination queries:
[frontend/src/features/tickets/pages/TicketListPage.tsx:28-35](frontend/src/features/tickets/pages/TicketListPage.tsx#L28-L35)

```typescript
  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, status, priority, search, sortBy, sortDirection],
    queryFn: () => apiFetch(`/tickets?${queryParams.toString()}`),
  });
```

### Automatic Fetch Invariants
- When `page` updates from `1` to `2`, TanStack Query notices the mismatch inside the query key.
- It checks if a cached entry exists for `['tickets', 2, ...]`.
- If missing, it immediately starts a background fetch while displaying your configured loading boundary.

---

## 2. Dynamic Mutation and Invalidation

When you mutate server data (such as posting a comment), the local client cache becomes stale. You must instruct TanStack Query to invalidate specific queries so they fetch fresh data.

Let's inspect comment submission inside our detail view:
[frontend/src/features/tickets/pages/TicketDetailPage.tsx:49-65](frontend/src/features/tickets/pages/TicketDetailPage.tsx#L49-L65)

```typescript
  // Post Comment Mutation
  const postCommentMutation = useMutation({
    mutationFn: (data: { body: string; isInternal: boolean }) =>
      apiFetch(`/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setCommentBody('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });
```

### The Invalidation Lifecycle
1. The user submits a comment. `postCommentMutation.mutate` executes.
2. The comment is sent via a POST request to Express.
3. Upon success, `onSuccess` runs.
4. `queryClient.invalidateQueries` is called, targeting both the generic `comments` list and the specific `ticket` detail cache entries.
5. TanStack Query flags these cache keys as stale and schedules a background fetch for any components rendering those keys, updating the timeline.

> **Senior aside:** *Always invalidate queries on mutations rather than assuming you can patch local arrays manually. Real systems have multiple concurrent actors; fetching from the server ensures you get the exact, single source of truth including any auto-generated database columns.*

---

## Pitfall Checklist

1. **Incorrect query key dependency arrays:** Leaving out variables inside the query key, causing the UI to show stale data when parameters change.
2. **Missing invalidation triggers:** Mutating a ticket status but forgetting to invalidate `['ticket', id]`.
3. **Bloating query caching times:** Setting indefinite `staleTime` values on highly dynamic resources.
4. **Infinite background refetch loops:** Setting triggers like `refetchOnWindowFocus` on routes with massive data payloads.
5. **No optimistic feedback boundaries:** Leaving users without visual loading cues during slow network updates.
6. **Ineffective mutation parameter matching:** Mismatching key shapes across queries and mutations.
7. **Not handling mutations errors:** Leaving state locked if the server returns 500 errors.
8. **Inline fetch duplication:** Executing manual `fetch` calls inside raw `useEffect` hooks rather than using TanStack Query.

---

## Drills

1. **Analyze Caching Lifecycle:** Open [frontend/src/features/tickets/pages/TicketDetailPage.tsx:32-47](frontend/src/features/tickets/pages/TicketDetailPage.tsx#L32-L47) and explain when the ticket list cache is updated vs when the detailed view is refreshed.
2. **Implement Optimistic Updating:** Write a custom mock mutation that updates a ticket's priority state instantly in local memory before verifying the server response.
3. **Trace Cache Statuses:** Use the React Query DevTools panel to watch queries shift between `fresh`, `stale`, and `fetching` states as you navigate pages.
