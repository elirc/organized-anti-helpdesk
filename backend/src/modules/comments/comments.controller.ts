import { Request, Response } from 'express';
import { commentsService } from './comments.service';

export class CommentsController {
  async getComments(req: Request, res: Response) {
    const result = await commentsService.getComments(
      req.params.ticketId,
      req.user.organizationId,
      req.user
    );
    res.json(result);
  }

  async createComment(req: Request, res: Response) {
    const result = await commentsService.createComment(
      req.params.ticketId,
      req.user.organizationId,
      req.user.id,
      req.user,
      req.body
    );
    res.status(201).json(result);
  }
}

export const commentsController = new CommentsController();
