import { Request, Response } from 'express';
import { tagsService } from './tags.service';

export class TagsController {
  async list(req: Request, res: Response) {
    const result = await tagsService.listTags(req.user.organizationId);
    res.json(result);
  }

  async create(req: Request, res: Response) {
    const result = await tagsService.createTag(
      req.user.organizationId,
      req.user.id,
      req.body
    );
    res.status(201).json(result);
  }

  async delete(req: Request, res: Response) {
    const result = await tagsService.deleteTag(
      req.user.organizationId,
      req.user.id,
      req.params.id
    );
    res.json(result);
  }

  async addToTicket(req: Request, res: Response) {
    const result = await tagsService.addTagToTicket(
      req.user.organizationId,
      req.user.id,
      req.user,
      req.params.ticketId,
      req.body.tagId
    );
    res.json(result);
  }

  async removeFromTicket(req: Request, res: Response) {
    const result = await tagsService.removeTagFromTicket(
      req.user.organizationId,
      req.user.id,
      req.user,
      req.params.ticketId,
      req.params.tagId
    );
    res.json(result);
  }
}

export const tagsController = new TagsController();
