# Layered Architecture: Strict Boundary Separation

A junior developer puts database queries directly inside controller files, mixing protocol handling with schema operations. A senior developer enforces a strict layered architecture, ensuring that each component has a single, well-defined responsibility.

---

## 1. Architectural Layers Diagram

Our system is structured into three isolated, sequential layers:

```
+-------------------------------------------------------+
| 1. Transport Layer (HTTP Protocol & Wire Mappings)   |
|    - Express Routing Pipeline                         |
|    - Request Validation Middleware (Zod Parsing)       |
|    - Controller Bindings                              |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
| 2. Business Logic Layer (Services & Invariants)       |
|    - Workflows & State Machines                       |
|    - Security Policy & Permission Enforcement        |
|    - Audit Logs & Event Triggering                    |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
| 3. Data Access Layer (Persistence & Relations)        |
|    - Prisma ORM Schema Maps                           |
|    - SQL Indexing Rules                               |
|    - Database Connection Isolation                    |
+-------------------------------------------------------+
```

---

## 2. Tracing a Layered Operation (Create Ticket)

Let's study the complete progression of a write operation across all three layers.

### Layer 1: The Transport Boundary
[backend/src/modules/tickets/tickets.controller.ts:16-25](backend/src/modules/tickets/tickets.controller.ts#L16-L25)
```typescript
  createTicket = async (req: Request, res: Response) => {
    const { title, description, priority } = req.body;
    const ticket = await ticketsService.createTicket(
      req.user.organizationId,
      req.user.id,
      { title, description, priority }
    );
```
The controller knows *nothing* about the database or SLA rules. It only parses the HTTP body, extracts parameters, and hands execution to the service.

### Layer 2: The Business Core
[backend/src/modules/tickets/tickets.service.ts:10-24](backend/src/modules/tickets/tickets.service.ts#L10-L24)
```typescript
  async createTicket(
    organizationId: string,
    actorId: string,
    data: { title: string; description: string; priority: any }
  ) {
    const slaDueAt = slaService.calculateSla(data.priority);

    const ticket = await ticketsRepository.create({
      organizationId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      createdById: actorId,
      slaDueAt,
    });
```
The service layer calculates the business rule (SLA times based on priority), manages audit streams, and triggers persistence.

### Layer 3: The Persistence Boundary
[backend/src/modules/tickets/tickets.repository.ts:12-23](backend/src/modules/tickets/tickets.repository.ts#L12-L23)
```typescript
  async create(data: {
    organizationId: string;
    title: string;
    description: string;
    priority: TicketPriority;
    createdById: string;
    slaDueAt: Date;
  }): Promise<Ticket> {
    return prisma.ticket.create({
      data
    });
  }
```
The repository works purely with raw database entities, hiding ORM specifics behind clean, decoupled function interfaces.

> **Senior aside:** *Never let your controllers communicate directly with database tools or repositories. Doing so contaminates layers and forces your routing system to change every time you modify database schemas or migrate database platforms.*

---

## Pitfall Checklist

1. **Bypassing the service layer:** Calling repositories directly from HTTP controllers.
2. **Exposing database models directly to network clients:** Allowing database schema modifications to break client UI expectations.
3. **HTTP imports inside service layers:** Importing Express `Request` or `Response` objects into pure services.
4. **No logical data transfer objects (DTO):** Passing raw network JSON bodies down to repositories without Zod parsing.
5. **Business rules inside repositories:** Hardcoding complex SLA or permission logic directly inside Prisma query strings.
6. **No repository interfaces:** Creating direct dependency imports between different service domains instead of aggregating lookups.
7. **Database transaction leaks:** Spanning a transaction boundary up into the HTTP routing lifecycle.
8. **Mismatched validation points:** Bypassing schema validation at the HTTP entry because types match structurally.

---

## Drills

1. **Audit Dependency Tree:** Open [backend/src/modules/tickets/tickets.routes.ts:1-12](backend/src/modules/tickets/tickets.routes.ts#L1-L12) and map out the complete import hierarchy, verifying there are no circular dependencies.
2. **Refactor Controller Layer:** Refactor the deletion controller [backend/src/modules/tickets/tickets.controller.ts:58-69](backend/src/modules/tickets/tickets.controller.ts#L58-L69) to verify that no Express properties are leaked to the underlying `ticketsService.deleteTicket` method.
3. **Dependency Contamination Test:** Create a dummy file in a pure service folder and try importing a `Response` type from `'express'`. Explain why this import violates the layered architecture rules.
