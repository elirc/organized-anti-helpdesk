import { TicketStatus } from '@prisma/client';

export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.WAITING_ON_INTERNAL, TicketStatus.RESOLVED],
  [TicketStatus.WAITING_ON_CUSTOMER]: [TicketStatus.IN_PROGRESS],
  [TicketStatus.WAITING_ON_INTERNAL]: [TicketStatus.IN_PROGRESS],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
  [TicketStatus.CLOSED]: []
};

export const canTransition = (from: TicketStatus, to: TicketStatus): boolean => {
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
};
