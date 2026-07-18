import { z } from 'zod';
import { TicketPriority, TicketStatus } from '@prisma/client';

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string()
      .min(5, 'Title must be at least 5 characters')
      .max(120, 'Title must not exceed 120 characters'),
    description: z.string()
      .min(10, 'Description must be at least 10 characters'),
    priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
  }),
});

export const updateTicketSchema = z.object({
  body: z.object({
    title: z.string()
      .min(5, 'Title must be at least 5 characters')
      .max(120, 'Title must not exceed 120 characters')
      .optional(),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
  }),
});

export const listTicketsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    pageSize: z.string().regex(/^\d+$/).transform(Number).default('20'),
    status: z.nativeEnum(TicketStatus).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    assignedToId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortDirection: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const changeStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(TicketStatus),
  }),
});

export const assignTicketSchema = z.object({
  body: z.object({
    assignedToId: z.string().nullable(),
  }),
});
