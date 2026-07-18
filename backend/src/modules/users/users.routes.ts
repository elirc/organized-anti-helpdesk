import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/requireRole.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { Role } from '@prisma/client';
import { inviteUserSchema, updateUserRoleSchema, toggleUserStatusSchema } from './users.schemas';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(usersController.list));
router.get('/:id', asyncHandler(usersController.getProfile));

// Owner & Admin only routes
const requireAdminOrOwner = requireRole([Role.OWNER, Role.ADMIN]);

router.post(
  '/invite',
  requireAdminOrOwner,
  validateRequest(inviteUserSchema),
  asyncHandler(usersController.invite)
);

router.patch(
  '/:id/role',
  requireAdminOrOwner,
  validateRequest(updateUserRoleSchema),
  asyncHandler(usersController.updateRole)
);

router.patch(
  '/:id/deactivate',
  requireAdminOrOwner,
  validateRequest(toggleUserStatusSchema),
  asyncHandler(usersController.deactivate)
);

router.patch(
  '/:id/reactivate',
  requireAdminOrOwner,
  validateRequest(toggleUserStatusSchema),
  asyncHandler(usersController.reactivate)
);

export const userRoutes = router;
