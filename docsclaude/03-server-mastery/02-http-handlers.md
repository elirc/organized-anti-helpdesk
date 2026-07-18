# The Express HTTP Handler & Middleware Lifecycle

A senior engineer designs robust request lifecycles. They establish strict perimeters using structured middleware pipelines, map exception boundaries explicitly, and prevent unhandled process crashes through global error adapters.

---

## 1. Request Lifecycles & Pipeline Middleware

In Express, a request flows through a chain of functions. Each function (middleware) has access to the `Request` and `Response` objects, and a `next()` callback to pass execution control to the next link in the chain.

Let's trace our secure ticket endpoints route configuration:
[backend/src/modules/tickets/tickets.routes.ts:15-28](backend/src/modules/tickets/tickets.routes.ts#L15-L28)

```typescript
router.post(
  '/',
  authenticate,
  validate(createTicketSchema),
  asyncHandler(ticketsController.createTicket)
);
```

### The Middleware Execution Sequence
1. **Socket Connection:** Express accepts the socket connection and instantiates the `req` and `res` objects.
2. **Auth Middleware (`authenticate`):** Resolves the Bearer token, queries the active user, and binds it to `req.user`. If missing, execution halts, returning 401.
3. **Validation Middleware (`validate`):** Validates and parses the request query/body against `createTicketSchema`. If invalid, Zod throws an exception.
4. **Async Controller Handler (`createTicket`):** Invokes our service layer to process the business logic.

---

## 2. Global Exception Boundaries

If a handler throws an exception during execution, it must be intercepted, cataloged, and cleanly formatted before returning to the caller.

Let's inspect our global error-handling middle-layer:
[backend/src/middleware/error.middleware.ts:4-18](backend/src/middleware/error.middleware.ts#L4-L18)

```typescript
export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
    });
  }

  console.log(err);
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
};
```

### The Classification Boundary
- **Expected Application Errors (`AppError`):** Represent validation failures, permission blocks, or resource misses. They are cleanly returned with specific status codes.
- **Unexpected Failures (Runtime Errors):** Mapped generically to `500 INTERNAL_ERROR` to hide underlying DB or engine connection variables from external inspection.

> **Senior aside:** *Never return raw DB errors or system exception traces to clients. Doing so exposes internals of your system structure (such as database schemas or field names) which can be targeted by attackers. Always map to sanitized messages.*

---

## Pitfall Checklist

1. **Forgetting to call next():** Leaving Express hanging indefinitely on request processing.
2. **Double response sending:** Attempting to write response headers twice, crashing the process with "headers already sent" exceptions.
3. **No global error handling catch-all:** Permitting database query failures to crash the execution thread.
4. **Skipping parameter validation:** Accessing path strings directly without schema coercion.
5. **Slow database execution blocking routing thread:** Performing deep lookups inside middleware loops.
6. **No logging on internal errors:** Hiding 500 errors from backend developers, making production tracing impossible.
7. **Bypassing cors settings:** Permitting open client access without scoping authorized origin vectors.
8. **Inconsistent request objects typing:** Overwriting `req` parameters with conflicting structural properties.

---

## Drills

1. **Trace Error Stack:** Open [backend/src/shared/errors/AppError.ts:1-12](backend/src/shared/errors/AppError.ts#L1-L12) and explain how custom error code parameters are configured.
2. **Custom Middleware Creation:** Write a custom logging middleware that measures and console.logs the execution time of incoming requests.
3. **Test double-send recovery:** Create a scratch script with a route handler that calls `res.send()` and then attempts to call `res.json()`, and observe the exact console traceback.
