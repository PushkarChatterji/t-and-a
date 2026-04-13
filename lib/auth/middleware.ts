import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, type JwtPayload } from './jwt';
import type { Role } from '@/lib/utils/constants';

// Attach user to request via a WeakMap to avoid type conflicts with Next.js route types
const userMap = new WeakMap<NextRequest, JwtPayload>();

export function getRequestUser(req: NextRequest): JwtPayload | undefined {
  return userMap.get(req);
}

export type AuthedNextRequest = NextRequest;

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse | Response>;

export function withAuth(handler: RouteHandler, allowedRoles?: Role[]): RouteHandler {
  return async (req: NextRequest, ctx: RouteContext) => {
    const authHeader = req.headers.get('authorization');
    const cookieToken = req.cookies.get('accessToken')?.value;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let payload: JwtPayload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    userMap.set(req, payload);
    return handler(req, ctx);
  };
}
