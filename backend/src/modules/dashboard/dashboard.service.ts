import prisma from '../../db/prisma';
import { Role, TicketStatus, TicketPriority } from '@prisma/client';

export class DashboardService {
  async getSummary(organizationId: string, user: any) {
    const where: any = { organizationId };

    // Requester gets limited stats (only their own tickets)
    if (user.role === Role.REQUESTER) {
      where.createdById = user.id;
    }

    const [totalOpen, assignedToMe, unassigned, urgent, overdueSla] = await Promise.all([
      // Total Open Tickets
      prisma.ticket.count({
        where: {
          ...where,
          status: {
            in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.WAITING_ON_INTERNAL]
          }
        }
      }),
      // Assigned to me (Only relevant for Agents/Admins/Owners, but we query for all)
      prisma.ticket.count({
        where: {
          ...where,
          assignedToId: user.id,
          status: {
            not: TicketStatus.CLOSED
          }
        }
      }),
      // Unassigned Tickets
      prisma.ticket.count({
        where: {
          ...where,
          assignedToId: null,
          status: {
            notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED]
          }
        }
      }),
      // Urgent Tickets
      prisma.ticket.count({
        where: {
          ...where,
          priority: TicketPriority.URGENT,
          status: {
            notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED]
          }
        }
      }),
      // Overdue SLA
      prisma.ticket.count({
        where: {
          ...where,
          slaDueAt: {
            lt: new Date()
          },
          status: {
            notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED]
          }
        }
      })
    ]);

    return {
      totalOpen,
      assignedToMe,
      unassigned,
      urgent,
      overdueSla
    };
  }

  async getTicketsByStatus(organizationId: string, user: any) {
    const where: any = { organizationId };
    if (user.role === Role.REQUESTER) {
      where.createdById = user.id;
    }

    const groupResult = await prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    });

    const statusMap: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      WAITING_ON_CUSTOMER: 0,
      WAITING_ON_INTERNAL: 0,
      RESOLVED: 0,
      CLOSED: 0
    };

    groupResult.forEach((item) => {
      statusMap[item.status] = item._count.id;
    });

    return statusMap;
  }

  async getTicketsByPriority(organizationId: string, user: any) {
    const where: any = { organizationId };
    if (user.role === Role.REQUESTER) {
      where.createdById = user.id;
    }

    const groupResult = await prisma.ticket.groupBy({
      by: ['priority'],
      where,
      _count: {
        id: true
      }
    });

    const priorityMap: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0
    };

    groupResult.forEach((item) => {
      priorityMap[item.priority] = item._count.id;
    });

    return priorityMap;
  }

  async getSlaSummary(organizationId: string, user: any) {
    const where: any = { organizationId };
    if (user.role === Role.REQUESTER) {
      where.createdById = user.id;
    }

    // SLA Summary (breached vs pending)
    const now = new Date();
    const [breached, active] = await Promise.all([
      prisma.ticket.count({
        where: {
          ...where,
          slaDueAt: { lt: now },
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
        }
      }),
      prisma.ticket.count({
        where: {
          ...where,
          slaDueAt: { gte: now },
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
        }
      })
    ]);

    return {
      breached,
      active,
      total: breached + active
    };
  }
}

export const dashboardService = new DashboardService();
