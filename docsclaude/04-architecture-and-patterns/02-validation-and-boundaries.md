# Validation & Boundaries: The Perimeter Pattern

A senior engineer treats the edge of the application as a strict validation perimeter. All data crossing this boundary (from HTTP clients, third-party hooks, or config scopes) is untrusted until parsed, while internal logic uses explicit custom error structures to propagate validation failures without process crashes.

---

## 1. Perimeter Validation vs. Internal Safety

We do not trust incoming network strings. Rather than passing raw parameters deep into the business core, we validate and coerce payloads using Zod at the HTTP entry boundary.

Let's study the schema mapping for listing:
[backend/src/modules/tickets/tickets.schemas.ts:28-39](backend/src/modules/tickets/tickets.schemas.ts#L28-L39)

```typescript
export const listTicketsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    pageSize: z.string().regex(/^\d+$/).transform(Number).default('20'),
    status: z.nativeEnum(TicketStatus).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    assignedToId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortDirection: z.enum(['asc', 'desc']).default('desc'),
  }),
});
```

### Why Parsing Beats Pure Typing
- **Type coercion:** Query params are string parameters. Zod parses `page` and coerces it into a real TypeScript `number` using `.transform(Number)`.
- **Filtering Extra Keys:** Zod strips keys not registered in the schema, protecting database operations from injection attacks.
- **Fail Closed:** If a parameter is invalid, the request is halted at the boundary, before hitting any databases or caches.

---

## 2. The Custom Error Class Hierarchy

Standard JavaScript `Error` objects lack metadata like HTTP status codes or API-level diagnostic error codes. We use a custom `AppError` class to carry this contextual payload.

[backend/src/shared/errors/AppError.ts:1-12](backend/src/shared/errors/AppError.ts#L1-L12)

```typescript
export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

### Crucial Language Detail: Prototype Alignment
In ES5 compilation targets, direct inheritance from the native `Error` class can fail to bind the prototype chain correctly. This means that executing `err instanceof AppError` would return `false`. Calling `Object.setPrototypeOf(this, AppError.prototype)` resolves this compilation target limitation, restoring `instanceof` safety.

> **Senior aside:** *Always use custom error classes to classify errors rather than returning generic Error structures with string checks like `if (err.message === 'Not Found')`. String checking is highly brittle and easily breaks during refactoring.*

---

## Pitfall Checklist

1. **Weak primitive type checks:** Bypassing structured schemas for raw properties like `if (typeof id === 'string')`.
2. **Missing prototype chain alignment:** Forgetting `Object.setPrototypeOf` in custom Error constructor configurations, breaking `instanceof` validations.
3. **No coercion transformations:** Passing raw string parameters (like limit pagination counters) to repositories that expect numbers.
4. **Soft-failing validation checks:** Returning default values on invalid structures instead of throwing.
5. **Leaking system variables:** Sending raw ORM error messages (like PG connection failures) back to users.
6. **No validation on DB seeders:** Inserting unvalidated structures into seed records.
7. **Trusting API types blindly:** Bypassing schema parsing on responses from third-party services.
8. **Loose path pattern matching:** Allowing string parameters to pass without exact regex checks (like UUID checks).

---

## Drills

1. **Audit Input Limits:** Open [backend/src/modules/tickets/tickets.schemas.ts:4-13](backend/src/modules/tickets/tickets.schemas.ts#L4-L13) and explain how characters constraints prevent memory overload attacks.
2. **Construct Custom Validation Schema:** Write a custom Zod validation schema that checks a telephone number string matches standard international formats.
3. **Error Prototype verification:** Write a scratch script that creates an instance of `AppError`, throws it, catches it, and asserts `instanceof AppError` returns `true`.
