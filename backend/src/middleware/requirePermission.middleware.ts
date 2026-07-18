import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { hasPermission } from '../shared/utils/permissions';

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(new AppError(`Forbidden: Missing permission ${permission}`, 403, 'FORBIDDEN'));
    }

    next();
  };
};
