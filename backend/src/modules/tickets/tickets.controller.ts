import { Request, Response } from 'express';
import { ticketsService } from './tickets.service';

export class TicketsController {
  async create(req: Request, res: Response) {
    const result = await ticketsService.createTicket(
      req.user.organizationId,
      req.user.id,
      req.body
    );
    res.status(201).json(result);
  }

  async get(req: Request, res: Response) {
    const result = await ticketsService.getTicket(
      req.params.id,
      req.user.organizationId,
      req.user
    );
    res.json(result);
  }

  async list(req: Request, res: Response) {
    const { page, pageSize, sortBy, sortDirection, status, priority, assignedToId, search } = req.query as any;

    const filters = { status, priority, assignedToId, search };
    const pagination = { page, pageSize };
    const sorting = { sortBy, sortDirection };

    const result = await ticketsService.listTickets(
      req.user.organizationId,
      req.user,
      filters,
      pagination,
      sorting
    );
    res.json(result);
  }

  async update(req: Request, res: Response) {
    const result = await ticketsService.updateTicket(
      req.params.id,
      req.user.organizationId,
      req.user.id,
      req.user,
      req.body
    );
    res.json(result);
  }

  async changeStatus(req: Request, res: Response) {
    const result = await ticketsService.changeStatus(
      req.params.id,
      req.user.organizationId,
      req.user.id,
      req.user,
      req.body.status
    );
    res.json(result);
  }

  async assign(req: Request, res: Response) {
    const result = await ticketsService.assignTicket(
      req.params.id,
      req.user.organizationId,
      req.user.id,
      req.user,
      req.body.assignedToId
    );
    res.json(result);
  }

  async delete(req: Request, res: Response) {
    const result = await ticketsService.deleteTicket(
      req.params.id,
      req.user.organizationId,
      req.user.id,
      req.user
    );
    res.json(result);
  }
}

export const ticketsController = new TicketsController();
