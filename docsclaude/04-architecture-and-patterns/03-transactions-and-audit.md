# Transactions & Non-Repudiation Audit Logs

A senior engineer understands that business mutations are defined by atomic transactions. If a ticket status updates, its corresponding history record and security audit event *must* persist concurrently. If any part of this operation fails, the entire database modification must rollback.

---

## 1. Traceability & Non-Repudiation Invariants

Our system logs two distinct layers of modification history:
1. **Ticket Activity Feed (`TicketActivity`):** An application-facing changelog rendering chronological updates (assignees, status changes) to clients.
2. **Audit Trails (`AuditEvent`):** A security-grade, read-only log recording actor identities, actions, and metadata for compliance audits.

Let's study the audit logger service:
[backend/src/modules/audit/audit.service.ts:3-23](backend/src/modules/audit/audit.service.ts#L3-L23)

```typescript
export class AuditService {
  async logEvent(data: {
    organizationId: string;
    actorId?: string;
    entityType: string;
    entityId: string;
    action: string;
    metadata?: any;
  }) {
    return prisma.auditEvent.create({
      data: {
        organizationId: data.organizationId,
        actorId: data.actorId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
      }
    });
  }
}
```

---

## 2. Acknowledging System Gaps: Transaction Vulnerabilities

Let's analyze the ticket status transition implementation:
[backend/src/modules/tickets/tickets.service.ts:186-207](backend/src/modules/tickets/tickets.service.ts#L186-L207)

```typescript
    const updatedTicket = await ticketsRepository.update(id, organizationId, updatedData);

    await prisma.ticketActivity.create({
      data: {
        organizationId,
        ticketId: id,
        actorId,
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: ticket.status,
        newValue: status
      }
    });

    await auditService.logEvent({
      organizationId,
      actorId,
      entityType: 'Ticket',
      entityId: id,
      action: 'STATUS_CHANGE',
      metadata: { from: ticket.status, to: status }
    });
```

### The Transaction Contamination Fragility
In the code above, the database writes are executed sequentially and separately:
1. **Write 1:** The ticket is updated inside PostgreSQL.
2. **Write 2:** An activity event is created.
3. **Write 3:** An audit event is created.

If a network interruption occurs between **Write 1** and **Write 2**, or if the database terminates before **Write 3**, the ticket's status changes but *no audit record is logged*. This leaves the audit logs in a corrupted, incomplete state.

### The Senior Solution: Database Transactions
To make this operation atomic, all writes must run inside a Prisma Transaction block:

```ts
// Illustrative — not from the repo
await prisma.$transaction(async (tx) => {
  await tx.ticket.update({ ... });
  await tx.ticketActivity.create({ ... });
  await tx.auditEvent.create({ ... });
});
```
If any database command inside `$transaction` throws an exception, PostgreSQL automatically rolls back the entire batch, ensuring the database stays clean.

> **Senior aside:** *Never leave multi-write operations ungrouped outside database transactions. An incomplete database write creates ghost records and corrupts audit integrity, which is highly unacceptable in regulated enterprise domains.*

---

## Pitfall Checklist

1. **Non-atomic multi-write mutations:** Updating a model and its log table in separate, unconnected queries.
2. **Slow external lookups inside transactions:** Holding database connections open while waiting for external API endpoints to respond.
3. **Missing organization filters on audit reads:** Permitting users to query audit logs of other organizations.
4. **Writing sensitive payload variables to audit logs:** Storing card numbers or user passwords inside the metadata JSON block.
5. **No database rollback validation:** Bypassing error checking during transactional operations.
6. **Ineffective schema mappings:** Mismatching transaction fields with database indices.
7. **Over-using transactions for read-only lookups:** Unnecessarily locking tables for standard select operations.
8. **Inconsistent timestamps:** Resolving dates on the application server rather than using PostgreSQL's database clock (`now()`).

---

## Drills

1. **Audit Security Flow:** Open [backend/src/modules/tickets/tickets.service.ts:212-264](backend/src/modules/tickets/tickets.service.ts#L212-L264) and explain whether the ticket assignment logs could end up out of sync if an assignment fails.
2. **Prisma Transaction Conversion:** Refactor `ticketsService.changeStatus` locally to wrap all database mutations inside an atomic `prisma.$transaction` block.
3. **Simulate Transaction Failure:** Write a scratch script that executes a two-step transaction block where the second step intentionally fails (e.g. unique constraint violation), and verify that the first write rolls back completely.
