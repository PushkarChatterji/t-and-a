import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import Session from '@/lib/db/models/Session';
import ActivityLog from '@/lib/db/models/ActivityLog';
import { verifyRefreshToken, signAccessToken } from '@/lib/auth/jwt';
import { getClientIp } from '@/lib/utils/ip';
import { ACTIVITY_ACTIONS, AUTO_LOGOFF_MINUTES } from '@/lib/utils/constants';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const refreshToken = req.cookies.get('refreshToken')?.value;
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 401 });
    }

    let sub: string;
    try {
      ({ sub } = verifyRefreshToken(refreshToken));
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
    }

    // Look up session directly by ID (set as cookie at login) — avoids scanning all sessions
    const sessionId = req.cookies.get('sessionId')?.value;
    const session = sessionId
      ? await Session.findOne({ _id: sessionId, userId: sub, isRevoked: false, expiresAt: { $gt: new Date() } })
      : null;

    if (!session || !(await bcrypt.compare(refreshToken, session.refreshTokenHash))) {
      return NextResponse.json({ success: false, error: 'Session not found or revoked' }, { status: 401 });
    }

    // Check inactivity
    const inactiveMins = (Date.now() - session.lastActivityAt.getTime()) / 60000;
    if (inactiveMins > AUTO_LOGOFF_MINUTES) {
      session.isRevoked = true;
      await session.save();
      await ActivityLog.create({
        userId: sub,
        action: ACTIVITY_ACTIONS.AUTO_LOGOFF,
        ipAddress: getClientIp(req),
        userAgent: req.headers.get('user-agent') ?? '',
      });
      const res = NextResponse.json({ success: false, error: 'Session expired due to inactivity' }, { status: 401 });
      res.cookies.delete('accessToken');
      res.cookies.delete('refreshToken');
      res.cookies.delete('sessionId');
      return res;
    }

    session.lastActivityAt = new Date();
    await session.save();

    const user = await User.findById(sub);
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });
    }

    const accessToken = signAccessToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
      schoolId: user.schoolId ? String(user.schoolId) : null,
    });

    const response = NextResponse.json({ success: true, data: { accessToken } });
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('[refresh]', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
