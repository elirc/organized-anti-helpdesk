import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

router.use(authenticate);

// Agents, admins, and owners must have 'dashboard:read'. Requesters have own ticket reads which is mapped in permission structure
router.get('/summary', asyncHandler(dashboardController.getSummary));
router.get('/tickets-by-status', asyncHandler(dashboardController.getTicketsByStatus));
router.get('/tickets-by-priority', asyncHandler(dashboardController.getTicketsByPriority));
router.get('/sla-summary', asyncHandler(dashboardController.getSlaSummary));

export { router as dashboardRoutes };
