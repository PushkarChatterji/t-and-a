import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import Subscription from '@/lib/db/models/Subscription';
import ActivityLog from '@/lib/db/models/ActivityLog';
import { hashPassword } from '@/lib/auth/password';
import { generateVerificationToken } from '@/lib/auth/email-verification';
import { sendVerificationEmail } from '@/lib/email/send';
import { signupSchema } from '@/lib/validators/auth';
import { created, badRequest, serverError } from '@/lib/utils/api-response';
import { getClientIp } from '@/lib/utils/ip';
import { ACTIVITY_ACTIONS } from '@/lib/utils/constants';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { firstName, lastName, gender, email, password, country, boardOfEducation, class: cls } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) return badRequest('An account with this email already exists');

    const passwordHash = await hashPassword(password);
    const { token, expiry } = generateVerificationToken();

    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      gender,
      country,
      boardOfEducation,
      class: cls,
      role: 'individual_student',
      emailVerificationToken: token,
      emailVerificationExpiry: expiry,
    });

    await Subscription.create({ userId: user._id, tier: 'free_trial' });

    await ActivityLog.create({
      userId: user._id,
      action: ACTIVITY_ACTIONS.SIGNUP,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get('user-agent') ?? '',
    });

    // Fire-and-forget email — don't fail signup if email fails
    sendVerificationEmail(email, token).catch(console.error);

    return created({ message: 'Account created. Please check your email to verify your account.' });
  } catch (err) {
    console.error('[signup]', err);
    return serverError();
  }
}
