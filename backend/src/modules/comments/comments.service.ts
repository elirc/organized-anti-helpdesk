import prisma from '../../db/prisma';
import { ticketsService } from '../tickets/tickets.service';
import { auditService } from '../audit/audit.service';
import { AppError } from '../../shared/errors/AppError';
import { Role } from '@prisma/client';

export class CommentsService {
  async getComments(ticketId: string, organizationId: string, user: any) {
    // This helper checks permissions and tenant isolation
    const ticket = await ticketsService.getTicket(ticketId, organizationId, user);

    const where: any = {
      ticketId,
      organizationId,
    };

    // If requester, hide internal comments
    if (user.role === Role.REQUESTER) {
      where.isInternal = false;
    }

    return prisma.ticketComment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      }
    });
  }

  async createComment(
    ticketId: string,
    organizationId: string,
    actorId: string,
    user: any,
    data: { body: string; isInternal: boolean }
  ) {
    const ticket = await ticketsService.getTicket(ticketId, organizationId, user);

    if (user.role === Role.REQUESTER) {
      if (data.isInternal) {
        throw new AppError('Forbidden: Requesters cannot post internal notes', 403);
      }
    }

    const comment = await prisma.ticketComment.create({
      data: {
        organizationId,
        ticketId,
        authorId: actorId,
        body: data.body,
        isInternal: data.isInternal,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      }
    });

    // Create activity event
    await prisma.ticketActivity.create({
      data: {
        organizationId,
        ticketId,
        actorId,
        action: data.isInternal ? 'NOTE_ADDED' : 'COMMENT_ADDED',
      }
    });

    // Create audit event
    await auditService.logEvent({
      organizationId,
      actorId,
      entityType: 'TicketComment',
      entityId: comment.id,
      action: 'CREATE',
      metadata: { isInternal: data.isInternal }
    });

    return comment;
  }
}

export const commentsService = new CommentsService();
