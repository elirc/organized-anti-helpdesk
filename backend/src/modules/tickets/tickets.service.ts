import { ticketsRepository, TicketListFilters } from './tickets.repository';
import { slaService } from './sla.service';
import { auditService } from '../audit/audit.service';
import { AppError } from '../../shared/errors/AppError';
import { Role, Ticket, TicketStatus } from '@prisma/client';
import { canTransition } from './ticket-status-machine';
import prisma from '../../db/prisma';

export class TicketsService {
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

    // Create activity event
    await prisma.ticketActivity.create({
      data: {
        organizationId,
        ticketId: ticket.id,
        actorId,
        action: 'CREATED',
      }
    });

    // Create audit event
    await auditService.logEvent({
      organizationId,
      actorId,
      entityType: 'Ticket',
      entityId: ticket.id,
      action: 'CREATE',
      metadata: { priority: data.priority },
    });

    return ticket;
  }

  async getTicket(id: string, organizationId: string, user: any) {
    const ticket = await ticketsRepository.findById(id, organizationId);
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    // Requester can only read their own tickets
    if (user.role === Role.REQUESTER && ticket.createdById !== user.id) {
      throw new AppError('Forbidden: Access denied', 403);
    }

    return ticket;
  }

  async listTickets(
    organizationId: string,
    user: any,
    filters: TicketListFilters,
    pagination: { page: number; pageSize: number },
    sorting: { sortBy: string; sortDirection: 'asc' | 'desc' }
  ) {
    const skip = (pagination.page - 1) * pagination.pageSize;
    const take = pagination.pageSize;

    // Requesters can only list their own tickets
    const createdById = user.role === Role.REQUESTER ? user.id : undefined;

    const { data, totalItems } = await ticketsRepository.list(
      organizationId,
      filters,
      { skip, take },
      sorting,
      createdById
    );

    return {
      data,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pagination.pageSize),
      }
    };
  }

  async updateTicket(
    id: string,
    organizationId: string,
    actorId: string,
    user: any,
    data: { title?: string; description?: string; priority?: any }
  ) {
    const ticket = await this.getTicket(id, organizationId, user);

    const updatedData: any = {};
    const activities: any[] = [];

    if (data.title && data.title !== ticket.title) {
      updatedData.title = data.title;
      activities.push({ field: 'title', oldValue: ticket.title, newValue: data.title });
    }

    if (data.description && data.description !== ticket.description) {
      updatedData.description = data.description;
      activities.push({ field: 'description', oldValue: ticket.description, newValue: data.description });
    }

    if (data.priority && data.priority !== ticket.priority) {
      updatedData.priority = data.priority;
      updatedData.slaDueAt = slaService.calculateSla(data.priority);
      activities.push({ field: 'priority', oldValue: ticket.priority, newValue: data.priority });
    }

    if (Object.keys(updatedData).length === 0) {
      return ticket;
    }

    const updatedTicket = await ticketsRepository.update(id, organizationId, updatedData);

    // Create activity & audit logs
    for (const act of activities) {
      await prisma.ticketActivity.create({
        data: {
          organizationId,
          ticketId: id,
          actorId,
          action: 'UPDATED',
          field: act.field,
          oldValue: act.oldValue,
          newValue: act.newValue
        }
      });
    }

    await auditService.logEvent({
      organizationId,
      actorId,
      entityType: 'Ticket',
      entityId: id,
      action: 'UPDATE',
      metadata: updatedData,
    });

    return updatedTicket;
  }

  async changeStatus(
    id: string,
    organizationId: string,
    actorId: string,
    user: any,
    status: TicketStatus
  ) {
    const ticket = await this.getTicket(id, organizationId, user);

    if (user.role === Role.REQUESTER) {
      const allowedRequesterTargets: TicketStatus[] = [TicketStatus.RESOLVED, TicketStatus.CLOSED];
      if (!allowedRequesterTargets.includes(status)) {
        throw new AppError('Forbidden: Requesters can only transition tickets to RESOLVED or CLOSED', 403);
      }
    }

    if (!canTransition(ticket.status, status)) {
      throw new AppError(`Invalid transition from ${ticket.status} to ${status}`, 400);
    }

    const updatedData: any = { status };
    if (status === TicketStatus.RESOLVED) {
      updatedData.resolvedAt = new Date();
    } else if (status === TicketStatus.CLOSED) {
      updatedData.closedAt = new Date();
    } else if (status === TicketStatus.IN_PROGRESS) {
      updatedData.resolvedAt = null;
      updatedData.closedAt = null;
    }

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

    return updatedTicket;
  }

  async assignTicket(
    id: string,
    organizationId: string,
    actorId: string,
    user: any,
    assignedToId: string | null
  ) {
    if (user.role === Role.REQUESTER) {
      throw new AppError('Forbidden: Requesters cannot assign tickets', 403);
    }

    const ticket = await this.getTicket(id, organizationId, user);

    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId }
      });

      if (!assignee || assignee.organizationId !== organizationId) {
        throw new AppError('Assignee must belong to the same organization', 400);
      }

      if (assignee.role === Role.REQUESTER) {
        throw new AppError('Cannot assign ticket to a requester', 400);
      }
    }

    const updatedTicket = await ticketsRepository.update(id, organizationId, {
      assignedToId
    });

    await prisma.ticketActivity.create({
      data: {
        organizationId,
        ticketId: id,
        actorId,
        action: 'ASSIGNED',
        field: 'assignedToId',
        oldValue: ticket.assignedToId || undefined,
        newValue: assignedToId || undefined
      }
    });

    await auditService.logEvent({
      organizationId,
      actorId,
      entityType: 'Ticket',
      entityId: id,
      action: 'ASSIGN',
      metadata: { assignedToId }
    });

    return updatedTicket;
  }

  async deleteTicket(id: string, organizationId: string, actorId: string, user: any) {
    if (user.role !== Role.OWNER && user.role !== Role.ADMIN) {
      throw new AppError('Forbidden: Only owners and admins can delete tickets', 403);
    }

    const ticket = await this.getTicket(id, organizationId, user);
    await ticketsRepository.delete(ticket.id);

    await auditService.logEvent({
      organizationId,
      actorId,
      entityType: 'Ticket',
      entityId: id,
      action: 'DELETE',
    });

    return { success: true };
  }
}

export const ticketsService = new TicketsService();
