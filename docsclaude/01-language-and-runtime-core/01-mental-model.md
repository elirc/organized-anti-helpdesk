# Mental Model of V8 and TypeScript Execution

To master engineering in a Node.js/TypeScript stack, you must understand how JS objects are processed in memory and how structural relationships are checked by the compiler.

---

## 1. Value vs Reference Propagation

In JavaScript, primitive values (numbers, strings, booleans, symbols, null, undefined) are copied by value. Objects (arrays, dictionaries, instances, functions) are copied by reference. When you pass a reference, you are copying the pointer on the heap, not the object data itself.

Let's look at a concrete database repository operation in our codebase:
[backend/src/modules/tickets/tickets.repository.ts:53-70](backend/src/modules/tickets/tickets.repository.ts#L53-L70)

```ts
  async list(
    organizationId: string,
    filters: TicketListFilters,
    pagination: { skip: number; take: number },
    sorting: { sortBy: string; sortDirection: 'asc' | 'desc' },
    createdById?: string // for requesters only
  ) {
    const where: any = {
      organizationId,
    };
```

In the method above, `filters`, `pagination`, and `sorting` are object parameters. They are passed as memory pointers from [backend/src/modules/tickets/tickets.service.ts:76-82](backend/src/modules/tickets/tickets.service.ts#L76-L82).

> **Senior aside:** *Always treat incoming object arguments as read-only. If you mutate a property of a passed object, such as changing `filters.status`, you leak side effects back to the calling service method, making the application fragile and difficult to trace.*

---

## 2. Closures & Memory Allocation

A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment). Every time a function is defined, a closure is created.

Consider our permission validation check:
[backend/src/middleware/requirePermission.middleware.ts:5-17](backend/src/middleware/requirePermission.middleware.ts#L5-L17)

```ts
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(new AppError(`Forbidden: Missing permission ${permission}`, 403, 'FORBIDDEN'));
    }

    next();
  };
};
```

### The Allocation Mechanism
1. `requirePermission` is called with the string `permission`.
2. The outer function creates a lexical scope block where the variable `permission` is stored.
3. It returns an anonymous middleware handler. This handler retains an active pointer link to the outer lexical scope.
4. Because the handler maintains this reference link, the V8 garbage collector cannot free the memory occupied by the `permission` string argument, even after `requirePermission` has returned.

---

## 3. Structural Typing vs Nominal Boundaries

Unlike languages like Java or C# which use nominal (name-based) typing, TypeScript uses **structural typing** (duck typing). If two types have the same shape, they are considered compatible, regardless of their names.

Let's look at `TicketListFilters`:
[backend/src/modules/tickets/tickets.repository.ts:4-9](backend/src/modules/tickets/tickets.repository.ts#L4-L9)

```ts
export interface TicketListFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
  search?: string;
}
```

If we define an inline object variable:
```ts
// Illustrative — not from the repo
const filterPayload = {
  status: 'OPEN',
  priority: 'MEDIUM',
  extraField: 'untrusted-data'
};
```
TypeScript will allow you to pass `filterPayload` to `list()` because it structurally satisfies `TicketListFilters`. The compiler strips extra keys on strict assignment checks, but at runtime, V8 retains the `extraField` property!

---

## Pitfall Checklist

1. **Mutating function parameters:** Changing object property values directly instead of using spread operations (`{ ...obj }`).
2. **Memory leak from closures:** Creating event handlers dynamically that retain references to heavy objects in outer scopes.
3. **Implicit type coercion:** Relying on loose equality checks (`==`) instead of strict comparison (`===`).
4. **Incorrect structural compatibility assumption:** Assuming TypeScript cleans up object properties at runtime; extra properties still exist on the heap.
5. **Stale closure values:** Referencing mutable outer variables inside async scopes.
6. **Passing raw client payloads directly to database tools:** Trusting structural matching and skipping sanitation.
7. **Modifying frozen model instances:** Attempting to alter fields on read-only state structures.
8. **Heap exhaustion from large arrays:** Copying massive datasets repeatedly rather than processing elements in streams.

---

## Drills

1. **Closure Inspection:** Open [backend/src/middleware/requirePermission.middleware.ts:5-17](backend/src/middleware/requirePermission.middleware.ts#L5-L17) and explain how many scopes are traversed when resolving `permission` when an API request is handled.
2. **Object Mutation Test:** Write a small script under `<appDataDir>/brain/<conversation-id>/scratch/` that demonstrates the difference between referencing an object vs shallow cloning using spread syntax.
3. **Type Compatibility Experiment:** In [backend/src/modules/tickets/tickets.repository.ts:4-9](backend/src/modules/tickets/tickets.repository.ts#L4-L9), create a mock object that matches the interface structurally but includes extra keys, then pass it and console.log the raw output keys at runtime.
