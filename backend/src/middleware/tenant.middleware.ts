import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';

/**
 * Ensures that if an organizationId is provided in params or body, it matches the user's organization.
 * Most often, we don't even need this if we inject `req.user.organizationId` at the repository layer.
 * However, this middleware adds an extra layer of protection for endpoints that specify organizationId.
 */
export const enforceTenantIsolation = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }

  const { organizationId } = req.params;
  const bodyOrgId = req.body.organizationId;

  if (organizationId && organizationId !== req.user.organizationId) {
    return next(new AppError('Forbidden: Tenant mismatch', 403, 'TENANT_MISMATCH'));
  }

  if (bodyOrgId && bodyOrgId !== req.user.organizationId) {
    return next(new AppError('Forbidden: Tenant mismatch', 403, 'TENANT_MISMATCH'));
  }

  next();
};
