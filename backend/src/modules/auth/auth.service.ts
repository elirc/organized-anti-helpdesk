import prisma from '../../db/prisma';
import { hashPassword, comparePassword } from '../../shared/utils/password';
import { signAccessToken, signRefreshToken } from '../../shared/utils/jwt';
import { AppError } from '../../shared/errors/AppError';
import { Role } from '@prisma/client';

export class AuthService {
  async register(data: any) {
    // Check if org slug exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: data.organizationSlug }
    });

    if (existingOrg) {
      throw new AppError('Organization slug already taken', 400);
    }

    const hashedPassword = await hashPassword(data.password);

    // Create org and owner user
    const organization = await prisma.organization.create({
      data: {
        name: data.organizationName,
        slug: data.organizationSlug,
        users: {
          create: {
            email: data.email,
            passwordHash: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            role: Role.OWNER,
          }
        }
      },
      include: {
        users: true
      }
    });

    const user = organization.users[0];
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return { user, accessToken, refreshToken };
  }

  async login(data: any) {
    // We assume email is unique globally for MVP, though schema has @@unique([organizationId, email])
    // So if a user logs in, they specify email. If they have accounts in multiple orgs, we would need orgSlug.
    // Let's assume unique email across the system for simplicity, or we require orgSlug during login.
    // We will just find the first active user with this email.
    const user = await prisma.user.findFirst({
      where: { email: data.email, isActive: true },
      include: { organization: true }
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return { user, accessToken, refreshToken };
  }

  async listUsers(organizationId: string) {
    return prisma.user.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });
  }
}

export const authService = new AuthService();
