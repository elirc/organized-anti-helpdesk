import { Request, Response } from 'express';
import { attachmentsService } from './attachments.service';
import { AppError } from '../../shared/errors/AppError';

export class AttachmentsController {
  async upload(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }
    
    const result = await attachmentsService.uploadAttachment(
      req.user.organizationId,
      req.params.ticketId,
      req.user.id,
      req.file,
      req.user
    );
    res.status(201).json(result);
  }

  async list(req: Request, res: Response) {
    const result = await attachmentsService.listAttachments(
      req.user.organizationId,
      req.params.ticketId,
      req.user
    );
    res.json(result);
  }

  async download(req: Request, res: Response) {
    const { filePath, fileName, mimeType } = await attachmentsService.downloadAttachment(
      req.user.organizationId,
      req.params.id,
      req.user
    );
    
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(filePath);
  }

  async delete(req: Request, res: Response) {
    const result = await attachmentsService.deleteAttachment(
      req.user.organizationId,
      req.params.id,
      req.user.id,
      req.user
    );
    res.json(result);
  }
}

export const attachmentsController = new AttachmentsController();
