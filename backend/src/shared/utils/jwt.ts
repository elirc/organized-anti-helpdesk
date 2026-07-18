import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export type JwtPayload = {
  userId: string;
  organizationId: string;
  role: string;
};

export const signAccessToken = (user: User): string => {
  return jwt.sign(
    { userId: user.id, organizationId: user.organizationId, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );
};

export const signRefreshToken = (user: User): string => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as { userId: string };
};
