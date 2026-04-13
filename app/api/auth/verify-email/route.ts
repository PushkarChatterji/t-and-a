import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import { ok, badRequest, serverError } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { token } = await req.json();
    if (!token) return badRequest('Token is required');

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return badRequest('Invalid or expired verification link');
    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      return badRequest('Verification link has expired. Please sign up again.');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    return ok({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error('[verify-email]', err);
    return serverError();
  }
}
