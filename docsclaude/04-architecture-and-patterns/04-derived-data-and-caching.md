# Derived Data & Caching Architectures

A senior engineer avoids storing redundant computed data in the database. Instead of writing fields like `ticketsCount` to organization tables, they compute aggregates dynamically using database grouping optimizations, or cash-in on query cache engines to resolve performance trade-offs.

---

## 1. Static Database Fields vs. Dynamic Aggregation

When rendering metric dashboards, you need aggregate totals like status splits or priority partitions.

We have two options:
1. **Pre-computed State (Stored):** Incremented/decremented on the parent organization row during every ticket lifecycle state change. Highly vulnerable to concurrency sync drift.
2. **Dynamic Aggregation (Derived):** Aggregated dynamically from active tickets using DBMS aggregates. Always 100% correct, but can slow down on giant tables if missing compound indexes.

Let's study the status grouping aggregator implementation:
[backend/src/modules/dashboard/dashboard.service.ts:82-103](backend/src/modules/dashboard/dashboard.service.ts#L82-L103)

```typescript
    const groupResult = await prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    });

    const statusMap: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      WAITING_ON_CUSTOMER: 0,
      WAITING_ON_INTERNAL: 0,
      RESOLVED: 0,
      CLOSED: 0
    };

    groupResult.forEach((item) => {
      statusMap[item.status] = item._count.id;
    });

    return statusMap;
```

### The Optimization Invariant
Using Prisma's `groupBy`:
- The database compiles the count in a single clustered scan using index trees.
- It returns a concise array of counts.
- We then map the results into a static dictionary in memory.
This guarantees real-time accuracy without structural synchronizing risks.

---

## 2. Query Cache Invalidation Pathways

At the client layer, rather than executing database queries repeatedly on every component mount, we keep datasets cached in memory.

Let's look at the dashboard page data fetching configuration:
[frontend/src/features/dashboard/DashboardPage.tsx:13-33](frontend/src/features/dashboard/DashboardPage.tsx#L13-L33)

```typescript
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiFetch('/dashboard/summary'),
  });

  const { data: statusStats, isLoading: isStatusLoading } = useQuery({
    queryKey: ['dashboard', 'status'],
    queryFn: () => apiFetch('/dashboard/status'),
  });

  const { data: priorityStats, isLoading: isPriorityLoading } = useQuery({
    queryKey: ['dashboard', 'priority'],
    queryFn: () => apiFetch('/dashboard/priority'),
  });

  const { data: slaStats, isLoading: isSlaLoading } = useQuery({
    queryKey: ['dashboard', 'sla'],
    queryFn: () => apiFetch('/dashboard/sla'),
  });
```

### The Selective Invalidation Strategy
When an agent resolves a ticket:
- We don't invalidate unrelated caches like user profile states.
- We execute a target invalidation pipeline:
```ts
// Illustrative
queryClient.invalidateQueries({ queryKey: ['dashboard'] });
```
Because all dashboard queries share the prefix `['dashboard', ...]`, calling `invalidateQueries` with `['dashboard']` refreshes all metrics concurrently.

> **Senior aside:** *Design your cache key structures hierarchically. Using specific arrays like `['tickets', 'detail', id]` and `['tickets', 'list']` allows you to invalidate large groups of endpoints or individual resource entries cleanly without triggering massive unnecessary global fetch avalanches.*

---

## Pitfall Checklist

1. **Storing easily derived values in databases:** Writing redundant properties like `isOverdue` on the Ticket model instead of computing it dynamically by comparing dates.
2. **Missing parent index query keys:** Querying group aggregates without filtering by `organizationId`.
3. **No cache hierarchy planning:** Using flat strings like `"dashboard"` as query keys, preventing multi-key partial invalidations.
4. **Ignoring query parameters inside cache keys:** Fetching paginated tables with a static key `['tickets']`, causing page 2 to display page 1 cached data.
5. **Dynamic date parameters in cache keys:** Using `new Date()` directly in cache queries, causing cache misses on every rendering cycle because the timestamp continually updates.
6. **Inefficient memory mutations:** Attempting to alter selected cached references in memory directly instead of declaring proper mutations.
7. **Over-invalidating query caches:** Wiping out the entire cache on minor data edits, overloading the backend API.
8. **No staleTime configuration:** Permitting critical static settings endpoints to re-fetch on every mouse click.

---

## Drills

1. **Audit Dashboard Security:** Open [backend/src/modules/dashboard/dashboard.service.ts:5-12](backend/src/modules/dashboard/dashboard.service.ts#L5-L12) and explain how requesters are prevented from accessing global administrative metrics.
2. **Implement SLA Date check:** Write a utility helper that takes a ticket and returns boolean `true` if `new Date() > ticket.slaDueAt` without adding state properties to the model.
3. **Trace Cache Status Shifts:** Open the browser React Query DevTools and observe how cache keys are marked stale and updated as you perform actions on tickets.
