import { Router } from 'express';
import { ticketsController } from './tickets.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import {
  createTicketSchema,
  updateTicketSchema,
  listTicketsSchema,
  changeStatusSchema,
  assignTicketSchema
} from './tickets.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { commentRoutes } from '../comments/comments.routes';
import { tagsController } from '../tags/tags.controller';
import { assignTagSchema } from '../tags/tags.schemas';

const router = Router();

router.use(authenticate);

router.use('/:ticketId/comments', commentRoutes);

router.post(
  '/',
  requirePermission('ticket:create'),
  validateRequest(createTicketSchema),
  asyncHandler(ticketsController.create)
);

router.get(
  '/',
  requirePermission('ticket:read'),
  validateRequest(listTicketsSchema),
  asyncHandler(ticketsController.list)
);

router.get(
  '/:id',
  requirePermission('ticket:read'),
  asyncHandler(ticketsController.get)
);

router.patch(
  '/:id',
  requirePermission('ticket:update'),
  validateRequest(updateTicketSchema),
  asyncHandler(ticketsController.update)
);

router.patch(
  '/:id/status',
  requirePermission('ticket:update'),
  validateRequest(changeStatusSchema),
  asyncHandler(ticketsController.changeStatus)
);

router.patch(
  '/:id/assign',
  requirePermission('ticket:assign'),
  validateRequest(assignTicketSchema),
  asyncHandler(ticketsController.assign)
);

router.delete(
  '/:id',
  requirePermission('ticket:delete'),
  asyncHandler(ticketsController.delete)
);

router.post(
  '/:ticketId/tags',
  requirePermission('ticket:update'),
  validateRequest(assignTagSchema),
  asyncHandler(tagsController.addToTicket)
);

router.delete(
  '/:ticketId/tags/:tagId',
  requirePermission('ticket:update'),
  asyncHandler(tagsController.removeFromTicket)
);

export { router as ticketRoutes };
