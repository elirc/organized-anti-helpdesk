import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { loginSchema, registerSchema } from './auth.schemas';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

router.post('/register', validateRequest(registerSchema), asyncHandler(authController.register));
router.post('/login', validateRequest(loginSchema), asyncHandler(authController.login));
router.get('/me', authenticate, asyncHandler(authController.me));

export { router as authRoutes };
