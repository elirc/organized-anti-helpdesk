# API & Wire Layer Internals under the Hood

A senior engineer designs APIs with strict validation layers, consistent status codes, and type-safe payload mappings, ensuring that untrusted network strings are safely sanitized before they reach the core business logic.

---

## 1. REST Controllers & Wire Serialization

Our backend is built around a RESTful API pattern using Express controllers. The controller serves as the boundary between the HTTP transport layer and the internal application service layer.

Let's study the ticket creation controller endpoint:
[backend/src/modules/tickets/tickets.controller.ts:16-30](backend/src/modules/tickets/tickets.controller.ts#L16-L30)

```typescript
  createTicket = async (req: Request, res: Response) => {
    const { title, description, priority } = req.body;
    const ticket = await ticketsService.createTicket(
      req.user.organizationId,
      req.user.id,
      { title, description, priority }
    );
    res.status(201).json(ticket);
  };
```

### The Wire Layer Boundary
1. **Extraction:** The controller extracts target values from `req.body`.
2. **Actor binding:** It grabs the authenticated actor details (`req.user.organizationId`, `req.user.id`) populated by the upstream auth middleware.
3. **Execution:** It delegates business logic execution to the service layer.
4. **Serialization:** It sets the HTTP status to `201 Created` and invokes `res.json()`. Under the hood, this converts the JavaScript object into a JSON string using `JSON.stringify()`, sending it over the TCP socket.

---

## 2. Request Validation Middleware Architecture

Rather than repeating validation blocks inside every single controller, we use a generic `validate` middleware wrapper that parses requests against Zod schemas.

Let's look at the validation middleware:
[backend/src/middleware/validate.middleware.ts:1-18](backend/src/middleware/validate.middleware.ts#L1-L18)

```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../shared/errors/AppError';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new AppError(message, 400, 'VALIDATION_ERROR'));
      }
      next(error);
    }
  };
};
```

### The Re-assignment Invariant
Notice how we reassign the request properties: `req.body = parsed.body; req.query = parsed.query;`.
Zod schemas don't just validate fields; they strip unregistered query keys and transform data types (e.g. converting a numeric query string to an actual number). Reassigning the parsed result ensures that subsequent middleware and controllers work exclusively with **trusted, sanitized, and correctly typed data**.

> **Senior aside:** *Always validate route path parameters (`req.params`) using Zod. If path parameters contain UUID keys (like ticket IDs), validate their formats using `z.string().uuid()` to fail fast before querying the database.*

---

## Pitfall Checklist

1. **Directly exporting raw database structures without serialization:** Accidentally exposing hashed passwords or internal metadata fields to the client.
2. **Missing error handling in validation wrappers:** Allowing validation failures to trigger 500 crashes instead of clean 400 errors.
3. **Returning incorrect status codes:** Returning `200 OK` on resource creation instead of `201 Created`, or `200` on empty finds instead of `404 Not Found`.
4. **No validation on params:** Direct database queries on unvalidated path parameters.
5. **Payload bloat:** Returning complete relational graphs inside index endpoints, crushing payload transit.
6. **Ignoring JSON parse failures:** Not protecting routes from corrupted JSON body payloads.
7. **Using mutable shared middleware objects:** Modifying reusable Zod schemas dynamically inside middleware execution cycles.
8. **Inconsistent API response schemas:** Returning `data` wrappers on some routes and raw arrays on others.

---

## Drills

1. **Audit Validation Schemas:** Open [backend/src/modules/tickets/tickets.schemas.ts:41-45](backend/src/modules/tickets/tickets.schemas.ts#L41-L45) and explain why checking for a native enum values is highly safe.
2. **Endpoint Refactoring:** Add a mock serialization transformer function that takes a `User` model and returns a sanitized JSON object stripping the `passwordHash` field, and verify its correctness.
3. **Test Bad JSON Payloads:** Make an API request to a POST endpoint with an invalid JSON body (e.g., missing quotes) and observe whether Express catches it or crashes.
