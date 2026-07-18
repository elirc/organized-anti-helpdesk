import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { Role } from '@prisma/client';

export const requireRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Forbidden: Requires one of roles: ${roles.join(', ')}`, 403, 'FORBIDDEN'));
    }

    next();
  };
};
