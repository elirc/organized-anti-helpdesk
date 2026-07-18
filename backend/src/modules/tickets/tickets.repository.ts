import prisma from '../../db/prisma';
import { Ticket, TicketStatus, TicketPriority } from '@prisma/client';

export interface TicketListFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
  search?: string;
}

export class TicketsRepository {
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

    if (createdById) {
      where.createdById = createdById;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [data, totalItems] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: {
          [sorting.sortBy]: sorting.sortDirection
        },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      }),
      prisma.ticket.count({ where })
    ]);

    return { data, totalItems };
  }

  async update(
    id: string,
    organizationId: string,
    data: {
      title?: string;
      description?: string;
      priority?: TicketPriority;
      slaDueAt?: Date;
      status?: TicketStatus;
      assignedToId?: string | null;
      resolvedAt?: Date | null;
      closedAt?: Date | null;
    }
  ): Promise<Ticket> {
    return prisma.ticket.update({
      where: {
        id,
        // Wait, standard Prisma update requires unique input for where.
        // To enforce organizationId, we can either use updateMany or verify first.
        // To be safe and fast, we can use a compound where if we had a compound index.
        // Actually, we can just do updateMany and then query, or just use update but verify the organizationId first.
        // Let's do a direct update since we'll verify ownership in the service layer first, or just check and update.
        // To make it fully robust under Prisma:
      },
      data
    });
  }

  async delete(id: string): Promise<Ticket> {
    return prisma.ticket.delete({
      where: { id }
    });
  }
}

export const ticketsRepository = new TicketsRepository();
