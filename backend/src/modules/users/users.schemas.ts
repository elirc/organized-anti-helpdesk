import { z } from 'zod';
import { Role } from '@prisma/client';

export const inviteUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum([Role.ADMIN, Role.AGENT, Role.REQUESTER]),
    password: z.string().min(8, 'Temporary password must be at least 8 characters')
  })
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(Role)
  })
});

export const toggleUserStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID')
  })
});
