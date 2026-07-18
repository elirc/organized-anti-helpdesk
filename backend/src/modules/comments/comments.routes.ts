import { Router } from 'express';
import { commentsController } from './comments.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { createCommentSchema } from './comments.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

// mergeParams is important because the ticketId parameter is defined in the parent router
const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', asyncHandler(commentsController.getComments));
router.post('/', validateRequest(createCommentSchema), asyncHandler(commentsController.createComment));

export { router as commentRoutes };
