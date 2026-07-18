import { TicketPriority } from '@prisma/client';

export class SlaService {
  /**
   * Calculates the SLA deadline based on priority.
   * LOW: 72 hours
   * MEDIUM: 48 hours
   * HIGH: 24 hours
   * URGENT: 4 hours
   */
  calculateSla(priority: TicketPriority): Date {
    const now = new Date();
    let hoursToAdd = 48; // Default medium

    switch (priority) {
      case TicketPriority.LOW:
        hoursToAdd = 72;
        break;
      case TicketPriority.MEDIUM:
        hoursToAdd = 48;
        break;
      case TicketPriority.HIGH:
        hoursToAdd = 24;
        break;
      case TicketPriority.URGENT:
        hoursToAdd = 4;
        break;
    }

    now.setHours(now.getHours() + hoursToAdd);
    return now;
  }
}

export const slaService = new SlaService();
