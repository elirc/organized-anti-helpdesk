import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    body: z.string().min(1, 'Comment body must not be empty'),
    isInternal: z.boolean().default(false),
  }),
});
