# Advanced TypeScript Type System Power Tools

To construct extremely safe database abstractions and highly reusable component libraries, a senior engineer must master advanced TypeScript structures like branded types, mapped types, and conditional type inference.

---

## 1. Branded Types (Opaque Invariants)

By default, TypeScript's structural typing allows you to pass any string to a parameter that expects a string. If you have two different string-based identifiers, such as `userId` and `ticketId`, you can accidentally swap them without compiler errors.

We can enforce nominal type boundaries using **Branded Types**:

```ts
// Illustrative — not from the repo
type Brand<K, T> = K & { __brand: T };

export type UserId = Brand<string, 'UserId'>;
export type TicketId = Brand<string, 'TicketId'>;

function assignTicket(ticketId: TicketId, userId: UserId) {
  // Safe execution block
}

const rawUserId = 'usr_1234' as UserId;
const rawTicketId = 'tkt_5678' as TicketId;

// assignTicket(rawUserId, rawTicketId); 
// ^ Compiler Error: Type 'UserId' is not assignable to type 'TicketId'
```

By adding a fake property `__brand` that only exists at compile-time, we tell the compiler to treat these strings as completely distinct nominal structures.

---

## 2. Enforcing Object Interfaces via the `satisfies` Operator

Prior to TypeScript 4.9, validating that an object matched a type required an explicit type annotation, which widened all properties to the general interface. The `satisfies` operator validates that an object matches a shape while retaining its specific literal type inferences.

Let's study permissions definition mapping:
[backend/src/shared/utils/permissions.ts:3-29](backend/src/shared/utils/permissions.ts#L3-L29)

```ts
export const PERMISSIONS = {
  OWNER: ["*"],
  ADMIN: [
    "ticket:create",
    "ticket:read",
    "ticket:update",
    "ticket:delete",
    "ticket:assign",
    "user:manage",
    "dashboard:read",
    "organization:update"
  ],
  AGENT: [
    ...
```

If we wanted to enforce that `PERMISSIONS` matches a specific key mapping structurally, we could apply `satisfies`:

```ts
// Illustrative — not from the repo
type RolePermissions = Record<'OWNER' | 'ADMIN' | 'AGENT' | 'REQUESTER', string[]>;

export const PERMISSIONS = {
  OWNER: ["*"],
  ADMIN: ["ticket:create", "ticket:read"],
  AGENT: ["ticket:create"],
  REQUESTER: ["ticket:create"]
} satisfies RolePermissions;
```
Now, `PERMISSIONS.OWNER` is structurally checked against `RolePermissions` but still specifically inferred by the compiler as the precise literal `["*"]` rather than `string[]`, preserving strict read-only parameters.

---

## 3. Mapped and Conditional Types

Mapped types allow you to construct new types based on existing types. This is highly useful when constructing safe mutation objects.

```ts
// Illustrative — not from the repo
type ReadOnlyFields = 'id' | 'createdAt' | 'organizationId';

// Mapped type stripping read-only primary keys from patch structures
type UpdatableFields<T> = {
  [K in keyof T as K extends ReadOnlyFields ? never : K]: T[K]
};
```

> **Senior aside:** *Use mapped type utilities to construct your update payload interfaces rather than writing duplicate interfaces. This maintains a single source of truth and prevents you from accidentally exposing internal read-only primary keys to update operations.*

---

## Pitfall Checklist

1. **Over-complicating library code:** Creating triple-nested conditional types that confuse team members.
2. **Missing Brand Casts:** Forgetting to explicitly cast raw database strings when fetching records.
3. **Casting with `as any` inside power utilities:** Bypassing type checking within complex type definitions.
4. **Mismatched enums in mapped filters:** Assuming enums behave like strings when executing key mappings.
5. **Slow compiler checks:** Creating deeply recursive conditional types that drastically increase tsc build duration.
6. **Under-utilizing satisfies:** Using explicit broad type annotations on literals and losing key inference.
7. **Branding non-primitive objects:** Creating complex branded shapes which make runtime shallow copying difficult.
8. **Stale interface definitions:** Not updating mapped base structures when editing prisma schemas.

---

## Drills

1. **Audit Permissions Keys:** Open [backend/src/shared/utils/permissions.ts:3-29](backend/src/shared/utils/permissions.ts#L3-L29) and explain how you would apply a generic mapper to extract a union of all unique string permissions.
2. **Construct a Branded ID:** Write a custom branded string helper for `OrganizationId` and implement a mock service method that enforces it.
3. **Mapped Type Creation:** Create a mapped type that takes a standard model (e.g. `Ticket`) and wraps all its properties in `Promise<T>` resolving values.
