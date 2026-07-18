import prisma from '../../db/prisma';

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

export const auditService = new AuditService();
