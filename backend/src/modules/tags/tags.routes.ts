import { Router } from 'express';
import { tagsController } from './tags.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/requireRole.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { Role } from '@prisma/client';
import { createTagSchema, assignTagSchema } from './tags.schemas';

const router = Router();
router.use(authenticate);

// Global tags endpoints
router.get('/', asyncHandler(tagsController.list));

const requireAdminOrOwner = requireRole([Role.OWNER, Role.ADMIN]);

router.post(
  '/',
  requireAdminOrOwner,
  validateRequest(createTagSchema),
  asyncHandler(tagsController.create)
);

router.delete(
  '/:id',
  requireAdminOrOwner,
  asyncHandler(tagsController.delete)
);

export const tagsRoutes = router;
