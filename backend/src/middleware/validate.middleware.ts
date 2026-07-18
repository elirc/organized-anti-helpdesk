import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      next(new AppError(error.errors?.[0]?.message || 'Validation Error', 400, 'VALIDATION_ERROR'));
    }
  };
};
