import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import { generatePasswordResetToken } from '@/lib/auth/email-verification';
import { sendPasswordResetEmail } from '@/lib/email/send';
import { forgotPasswordSchema } from '@/lib/validators/auth';
import { ok, badRequest, serverError } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const { email } = parsed.data;
    const user = await User.findOne({ email, isActive: true });

    // Always return OK to prevent email enumeration
    if (user && user.emailVerified) {
      const { token, expiry } = generatePasswordResetToken();
      user.passwordResetToken = token;
      user.passwordResetExpiry = expiry;
      await user.save();
      sendPasswordResetEmail(email, token).catch(console.error);
    }

    return ok({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err) {
    console.error('[forgot-password]', err);
    return serverError();
  }
}
