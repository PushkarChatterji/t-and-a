import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import Session from '@/lib/db/models/Session';
import ActivityLog from '@/lib/db/models/ActivityLog';
import { verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validators/auth';
import { badRequest, serverError, unauthorized } from '@/lib/utils/api-response';
import { getClientIp } from '@/lib/utils/ip';
import { ACTIVITY_ACTIONS, AUTO_LOGOFF_MINUTES } from '@/lib/utils/constants';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const { email, password } = parsed.data;

    const user = await User.findOne({ email, isActive: true });
    if (!user) return unauthorized('Invalid email or password');

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return unauthorized('Invalid email or password');

    if (!user.emailVerified) {
      return unauthorized('Please verify your email before logging in');
    }

    const ip = getClientIp(req);
    const userAgent = req.headers.get('user-agent') ?? '';

    const refreshToken = signRefreshToken(String(user._id));
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const lastActivityAt = new Date();

    const session = await Session.create({ userId: user._id, refreshTokenHash, ipAddress: ip, userAgent, lastActivityAt, expiresAt });

    await ActivityLog.create({
      userId: user._id,
      action: ACTIVITY_ACTIONS.LOGIN,
      ipAddress: ip,
      userAgent,
    });

    const accessToken = signAccessToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
      schoolId: user.schoolId ? String(user.schoolId) : null,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          adaptiveLearningEnabled: user.adaptiveLearningEnabled,
          schoolId: user.schoolId,
        },
      },
    });

    const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
    response.cookies.set('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 });
    response.cookies.set('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 });
    response.cookies.set('sessionId', String(session._id), { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 });
    response.cookies.set('autoLogoffMinutes', String(AUTO_LOGOFF_MINUTES), { ...cookieOpts, httpOnly: false });

    return response;
  } catch (err) {
    console.error('[login]', err);
    return serverError();
  }
}
