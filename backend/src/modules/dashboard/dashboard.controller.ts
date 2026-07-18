import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';

export class DashboardController {
  async getSummary(req: Request, res: Response) {
    const result = await dashboardService.getSummary(
      req.user.organizationId,
      req.user
    );
    res.json(result);
  }

  async getTicketsByStatus(req: Request, res: Response) {
    const result = await dashboardService.getTicketsByStatus(
      req.user.organizationId,
      req.user
    );
    res.json(result);
  }

  async getTicketsByPriority(req: Request, res: Response) {
    const result = await dashboardService.getTicketsByPriority(
      req.user.organizationId,
      req.user
    );
    res.json(result);
  }

  async getSlaSummary(req: Request, res: Response) {
    const result = await dashboardService.getSlaSummary(
      req.user.organizationId,
      req.user
    );
    res.json(result);
  }
}

export const dashboardController = new DashboardController();
