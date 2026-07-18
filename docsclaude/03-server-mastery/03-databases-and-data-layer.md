# Relational Data Modeling & The Database Layer

A senior engineer designs database structures with high performance and data security in mind. They configure index fields to avoid expensive table scans, structure transactions cleanly, and recognize and resolve the infamous N+1 query patterns.

---

## 1. Multi-Tenant Database Indexing

In a multi-tenant SaaS application, almost every query filters records by the organization identifier (`organizationId`). If the database has to scan every row in the table to find matching organization records, performance will collapse as the database grows.

Let's study our indexes configured on `Ticket`:
[backend/prisma/schema.prisma:73-78](backend/prisma/schema.prisma#L73-L78)

```prisma
  @@index([organizationId])
  @@index([organizationId, status])
  @@index([organizationId, priority])
  @@index([organizationId, assignedToId])
  @@index([organizationId, createdById])
```

### The Composite Indexing Invariant
- **Standard Index vs. Composite Index:** An index on `organizationId` alone lets PostgreSQL locate tickets belonging to an organization. But if we search for all `OPEN` tickets within that organization, Postgres must still search through the organization's records.
- **Left-to-Right Index matching:** A composite index like `@@index([organizationId, status])` creates a single sorted search tree containing both values, returning matched records instantly. Because of left-to-right matching rules, a query searching for *only* `organizationId` can also leverage this composite index, saving disk space by reducing index redundancy.

---

## 2. Resolving the N+1 Query Problem

The N+1 query pattern occurs when your code queries a list of records, and then issues a separate follow-up query for *each individual record* to fetch a relational value. This results in `N + 1` network round-trips to the database, severely degrading API response times.

Prisma prevents this by allowing you to include relational nodes directly within the original query, combining the lookup into a single database join or optimized sub-query.

Let's review our ticket retrieval by ID:
[backend/src/modules/tickets/tickets.repository.ts:25-50](backend/src/modules/tickets/tickets.repository.ts#L25-L50)

```typescript
  async findById(id: string, organizationId: string): Promise<Ticket | null> {
    return prisma.ticket.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        assignedTo: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, email: true, firstName: true, lastName: true, role: true }
            }
          }
        },
        activities: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }
```

### Under the Hood Execution
By adding the `include` block with explicit field selectors:
1. Prisma compiles a query that fetches the `Ticket` record.
2. It fetches the related `createdBy` user, the `assignedTo` user, the ticket's `comments`, and the comment `authors` in a batch of highly optimized queries (typically using SQL joins or parameterized `IN` lists).
3. The total database network round-trip count remains exactly **1**, regardless of the number of comments or relationships present.

> **Senior aside:** *Always use specific `select` keys when including user associations. Never include raw user objects globally, as this accidentally leaks sensitive data (like the `passwordHash` string field) into the serializable client response payload.*

---

## Pitfall Checklist

1. **Missing tenant scope indexes:** Creating tables like `TicketComment` without registering index keys for `organizationId`.
2. **N+1 iterations:** Fetching users in a loop: `users.map(async u => await db.profile(u.id))`.
3. **Relational data over-fetching:** Including heavy relational entities (like comment lists) on query routes that only render main queues.
4. **Database lockups from open transactions:** Leaving transaction boundaries open while awaiting slow external HTTP calls.
5. **No unique constraints on tenant identifiers:** Failing to add `@@unique([organizationId, email])` on the `User` model, permitting users to register duplicate emails inside the same organization.
6. **Ineffective composite index orders:** Creating composite indexes that do not list `organizationId` as the leftmost key, preventing left-to-right lookup reuse.
7. **Writing raw SQL queries without parameterized inputs:** Introducing SQL Injection (SQLi) vulnerabilities.
8. **Out of sync ORM engines:** Executing backend logic on a model before executing migrations to align the database schema.

---

## Drills

1. **Analyze Indexing Strategy:** Open [backend/prisma/schema.prisma:95-96](backend/prisma/schema.prisma#L95-L96) and explain why the composite index `@@index([organizationId, ticketId])` is critical for ticket timeline performance.
2. **Prisma Transaction Conversion:** Refactor a mock controller operation that creates a ticket and adds a comment to execute both inside a Prisma transaction block (`prisma.$transaction`).
3. **Explain Query Plan Trace:** Boot PostgreSQL locally, execute `EXPLAIN ANALYZE SELECT * FROM "Ticket" WHERE "organizationId" = 'some-uuid';`, and identify whether a table scan or index scan was performed.
