import jwt from 'jsonwebtoken';
import type { Role } from '@/lib/utils/constants';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  schoolId: string | null;
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not configured');
  return s;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret(), {
    expiresIn: (process.env.JWT_ACCESS_EXPIRY ?? '15m') as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, secret()) as JwtPayload;
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, secret(), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRY ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, secret()) as { sub: string };
}
