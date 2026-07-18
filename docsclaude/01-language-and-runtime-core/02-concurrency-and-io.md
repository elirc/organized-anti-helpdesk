# Concurrency and I/O in the Node.js Runtime

JavaScript is single-threaded at the execution level but achieves massive concurrent capacity through its non-blocking asynchronous event loop. Understanding how V8 schedules tasks, microtasks, and handles Promise execution is essential to writing performant, race-free backend systems.

---

## 1. The Event Loop Architecture

Node.js executes JavaScript on a single thread. However, operations like disk access, network lookups, and database queries are outsourced to the operating system or pool threads (via libuv). When these operations complete, their callbacks are placed onto queue pipelines waiting for execution on the main thread.

The event loop processes tasks in distinct phases:
1. **Timers:** Processes callbacks scheduled by `setTimeout()` and `setInterval()`.
2. **Pending Callbacks:** Executes I/O callbacks deferred from prior cycles.
3. **Poll:** Retrieves new I/O events; executes I/O-related callbacks.
4. **Check:** Executes callbacks scheduled by `setImmediate()`.
5. **Close Callbacks:** Processes tear-down callbacks like socket closures.

Between every phase, V8 executes the **Microtask Queue** (which houses Promise resolutions and `process.nextTick()`). Microtasks run until the queue is completely exhausted.

---

## 2. Dynamic Promise Parallelism

To optimize network round-trips to databases or external caches, you should run independent operations concurrently rather than sequentially.

Let's study the ticket listing implementation:
[backend/src/modules/tickets/tickets.repository.ts:87-105](backend/src/modules/tickets/tickets.repository.ts#L87-L105)

```ts
    const [data, totalItems] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: {
          [sorting.sortBy]: sorting.sortDirection
        },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      }),
      prisma.ticket.count({ where })
    ]);
```

### The Async Execution Flow
1. `prisma.ticket.findMany` is executed. V8 constructs a Promise object. The Node database client issues a TCP request to Postgres.
2. Instead of waiting for the database response, execution yields instantly.
3. `prisma.ticket.count` is executed. Another Promise is constructed, and another Postgres TCP request is made.
4. `Promise.all` registers a listener mapping both Promises to wait.
5. V8 returns to the event loop pool to handle incoming requests.
6. When both DB queries resolve, the microtask queue schedules their resolution handler, resuming execution of the service layer.

> **Senior aside:** *Using await sequentially for independent operations like `await findMany(); await count();` doubles your API latency. Always use `Promise.all` to pipeline queries concurrently. However, verify that you aren't overloading the database connection pool with massive parallel tasks.*

---

## 3. Promise Boundary Execution & Error Safety

An unhandled promise rejection occurs when a Promise is rejected but no catch handler is attached. In production environments, this can lead to memory leaks or crash the thread.

Let's look at how our backend routes catch async exceptions:
[backend/src/shared/utils/asyncHandler.ts:1-7](backend/src/shared/utils/asyncHandler.ts#L1-L7)

```ts
import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### Why This Design is Crucial
Express 4 does not natively catch asynchronous route errors. If a handler throws an exception during an `await` execution, it registers as an unhandled promise rejection.
By wrapping handlers with `Promise.resolve(fn(...)).catch(next)`, any async error is automatically caught and forwarded to the Express global error-handling middle-layer, preserving process stability.

---

## Pitfall Checklist

1. **Sequential Awaiting of Independent Queries:** Doing `const user = await getUser(); const org = await getOrg();` when they could run concurrently.
2. **Missing `catch` handlers in raw Promises:** Forgetting to handle rejections inside asynchronous events.
3. **Blocking the event loop:** Performing synchronous CPU-heavy algorithms like heavy hashing or giant loops on the main thread.
4. **Floating Promises:** Triggering async tasks without awaiting them, causing them to execute outside error boundaries.
5. **Race conditions inside state updates:** Assuming state hasn't mutated between an async yield and its return.
6. **Thread pool exhaustion:** Opening too many concurrent requests without balancing `UV_THREADPOOL_SIZE`.
7. **Nested await loops:** Using `await` inside standard `forEach` callbacks.
8. **Resource leaks from un-closed listeners:** Forgetting to clear event emitters or socket hooks.

---

## Drills

1. **Trace Async Handler Flow:** Open [backend/src/modules/tickets/tickets.routes.ts:15-28](backend/src/modules/tickets/tickets.routes.ts#L15-L28) and trace exactly how exceptions are propagated to the client when validation fails.
2. **Concurrency Speed Test:** Write a script in your scratch directory comparing the execution speed of three sequential queries vs three concurrent queries executed via `Promise.all`.
3. **Race Condition Simulation:** Create a mock helper function that simulates a bank transfer with a 50ms database delay, then call it twice concurrently to see if balance values conflict.
