import prisma from '../../db/prisma';
import { AppError } from '../../shared/errors/AppError';
import { auditService } from '../audit/audit.service';
import { hashPassword } from '../../shared/utils/password';
import { Role } from '@prisma/client';

export class UsersService {
  async listUsers(organizationId: string) {
    return prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUserProfile(organizationId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedTickets: true,
            createdTickets: true,
            comments: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async inviteUser(organizationId: string, actorId: string, data: any) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, organizationId }
    });

    if (existing) {
      throw new AppError('User with this email already exists in this organization', 400);
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        organizationId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        passwordHash: hashedPassword,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    await auditService.logEvent({
      organizationId,
      actorId,
      entityType: 'User',
      entityId: user.id,
      action: 'INVITE',
      metadata: { role: data.role }
    });

    return user;
  }

  async updateUserRole(organizationId: string, actorId: string, targetUserId: string, newRole: Role) {
    if (actorId === targetUserId) {
      throw new AppError('Cannot change your own role', 400);
    }

    const user = await prisma.user.findFirst({
      where: { id: targetUserId, organizationId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === Role.OWNER) {
      throw new AppError('Cannot change role of an OWNER', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    await auditService.logEvent({
      organizationId,
      actorId,
      entityType: 'User',
      entityId: targetUserId,
      action: 'ROLE_CHANGED',
      metadata: { oldRole: user.role, newRole }
    });

    return updatedUser;
  }

  async toggleUserStatus(organizationId: string, actorId: string, targetUserId: string, isActive: boolean) {
    if (actorId === targetUserId) {
      throw new AppError('Cannot deactivate yourself', 400);
    }

    const user = await prisma.user.findFirst({
      where: { id: targetUserId, organizationId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === Role.OWNER) {
      throw new AppError('Cannot deactivate an OWNER', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    await auditService.logEvent({
      organizationId,
      actorId,
      entityType: 'User',
      entityId: targetUserId,
      action: isActive ? 'REACTIVATE' : 'DEACTIVATE',
    });

    return updatedUser;
  }
}

export const usersService = new UsersService();
