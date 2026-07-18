# Type System Essentials: Compile-Time vs. Runtime

TypeScript is a static analysis layer that disappears entirely at runtime. A senior developer designs strict compile-time types while validating all untrusted data boundaries at runtime to ensure system invariants are never bypassed.

---

## 1. Type Narrowing and Control Flow Analysis

TypeScript traces how variables change types over the lifecycle of a code block. When you perform checks like `if (user.role === Role.REQUESTER)`, TypeScript statically narrows the type of `user` for the remainder of that branch.

Let's study type narrowing inside our status workflow transition:
[backend/src/modules/tickets/tickets.service.ts:163-170](backend/src/modules/tickets/tickets.service.ts#L163-L170)

```ts
    const ticket = await this.getTicket(id, organizationId, user);

    if (user.role === Role.REQUESTER) {
      const allowedRequesterTargets: TicketStatus[] = [TicketStatus.RESOLVED, TicketStatus.CLOSED];
      if (!allowedRequesterTargets.includes(status)) {
        throw new AppError('Forbidden: Requesters can only transition tickets to RESOLVED or CLOSED', 403);
      }
    }
```

### The Narrowing Process
- The compiler knows that `user` matches the broad type `User`.
- When the conditional `if (user.role === Role.REQUESTER)` executes, the compiler narrows the type of `user` within that block to exclusively represent users holding the `REQUESTER` role.
- If you attempt to access an administrative property inside this branch, the compiler will flag a type-safety compilation error.

---

## 2. Runtime Contracts with Zod

Because TypeScript types do not exist at runtime, untrusted incoming HTTP payloads can easily violate type contracts. We use **Zod** to validate and parse raw inputs at the application perimeter.

Let's review the listing query schema:
[backend/src/modules/tickets/tickets.schemas.ts:28-39](backend/src/modules/tickets/tickets.schemas.ts#L28-L39)

```ts
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

### Why Transform Matters
The HTTP query parameters are initially strings. Doing `page: z.string().regex(/^\d+$/).transform(Number)` achieves two invariants:
1. **Validation:** Assures the string contains exclusively digits.
2. **Coercion:** Coerces the validated string into a real TypeScript `number` type on the parsed object, satisfying downstream repository boundaries.

> **Senior aside:** *Never cast untrusted data using type assertions like `req.body as CreateTicketInput`. Always parse the payload using Zod. If the payload is invalid, fail closed immediately before it reaches your repository layer.*

---

## Pitfall Checklist

1. **Over-reliance on `any`:** Disabling compiler safety checks by bypassing types.
2. **Unvalidated Type Assertions:** Writing `data as Ticket` instead of validating through Zod schemas.
3. **Mismatched compile-time and runtime enums:** Relying on TypeScript enums which compile to objects, rather than string unions.
4. **Transform failures:** Failing to validate that strings are numeric before applying `transform(Number)`.
5. **Ignoring compiler strict-mode checks:** Disabling `strictNullChecks` inside `tsconfig.json`.
6. **Ineffective narrowing:** Narrowing a type but failing to return or throw, leaking the broad type down the stack.
7. **Implicit enums index assignment:** Using standard index-based enums rather than explicit string enums.
8. **Trusting third-party API types:** Bypassing validation on external API payloads.

---

## Drills

1. **Identify Strict Checking:** Open [backend/src/modules/tickets/tickets.schemas.ts:15-26](backend/src/modules/tickets/tickets.schemas.ts#L15-L26) and explain how optional fields are handled.
2. **Custom Narrowing Exercise:** Write a custom type guard function `isAgent(user: any): user is Agent` that checks role properties and proves the type change to the compiler.
3. **Parse Failure Test:** Create a scratch script that executes a Zod parse on an empty payload and logs the detailed validation errors formatting.
