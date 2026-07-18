import prisma from '../../db/prisma';
import { AppError } from '../../shared/errors/AppError';
import { auditService } from '../audit/audit.service';
import { ticketsService } from '../tickets/tickets.service';

export class TagsService {
  async listTags(organizationId: string) {
    return prisma.tag.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' }
    });
  }

  async createTag(organizationId: string, actorId: string, data: { name: string, color: string }) {
    const existing = await prisma.tag.findFirst({
      where: { name: data.name, organizationId }
    });

    if (existing) {
      throw new AppError('Tag with this name already exists', 400);
    }

    const tag = await prisma.tag.create({
      data: {
        organizationId,
        name: data.name,
        color: data.color
      }
    });

    await auditService.logEvent({
      organizationId,
      actorId,
      entityType: 'Tag',
      entityId: tag.id,
      action: 'CREATE',
      metadata: data
    });

    return tag;
  }

  async deleteTag(organizationId: string, actorId: string, tagId: string) {
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, organizationId }
    });

    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    await prisma.tag.delete({
      where: { id: tagId }
    });

    await auditService.logEvent({
      organizationId,
      actorId,
      entityType: 'Tag',
      entityId: tagId,
      action: 'DELETE',
      metadata: { name: tag.name }
    });

    return { success: true };
  }

  async addTagToTicket(organizationId: string, actorId: string, user: any, ticketId: string, tagId: string) {
    // Check ticket access
    const ticket = await ticketsService.getTicket(ticketId, organizationId, user);
    
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, organizationId }
    });

    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        tags: { connect: { id: tagId } }
      }
    });

    await prisma.ticketActivity.create({
      data: {
        organizationId,
        ticketId,
        actorId,
        action: 'TAG_ADDED',
        newValue: tag.name
      }
    });

    return { success: true };
  }

  async removeTagFromTicket(organizationId: string, actorId: string, user: any, ticketId: string, tagId: string) {
    const ticket = await ticketsService.getTicket(ticketId, organizationId, user);

    const tag = await prisma.tag.findFirst({
      where: { id: tagId, organizationId }
    });

    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        tags: { disconnect: { id: tagId } }
      }
    });

    await prisma.ticketActivity.create({
      data: {
        organizationId,
        ticketId,
        actorId,
        action: 'TAG_REMOVED',
        oldValue: tag.name
      }
    });

    return { success: true };
  }
}

export const tagsService = new TagsService();
