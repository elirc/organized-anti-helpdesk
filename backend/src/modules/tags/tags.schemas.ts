import { z } from 'zod';

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tag name is required').max(30),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
  })
});

export const assignTagSchema = z.object({
  body: z.object({
    tagId: z.string().uuid()
  })
});
