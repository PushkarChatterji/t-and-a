import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Session from '@/lib/db/models/Session';
import ActivityLog from '@/lib/db/models/ActivityLog';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getClientIp } from '@/lib/utils/ip';
import { ACTIVITY_ACTIONS } from '@/lib/utils/constants';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const cookieToken = req.cookies.get('accessToken')?.value;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    if (token) {
      try {
        const payload = verifyAccessToken(token);
        await Session.updateMany({ userId: payload.sub, isRevoked: false }, { isRevoked: true });
        await ActivityLog.create({
          userId: payload.sub,
          action: ACTIVITY_ACTIONS.LOGOUT,
          ipAddress: getClientIp(req),
          userAgent: req.headers.get('user-agent') ?? '',
        });
      } catch {
        // token may be expired — still clear cookies
      }
    }

    const response = NextResponse.json({ success: true, data: { message: 'Logged out' } });
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('sessionId');
    return response;
  } catch (err) {
    console.error('[logout]', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
