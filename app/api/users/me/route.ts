import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const doc = await User.findById(user.sub).select('-passwordHash -emailVerificationToken -passwordResetToken');
    if (!doc) return ok(null, 404);
    return ok(doc);
  } catch (err) {
    console.error('[users/me GET]', err);
    return serverError();
  }
});

export const PATCH = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const body = await req.json();
    const allowed = ['adaptiveLearningEnabled', 'firstName', 'lastName'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    const doc = await User.findByIdAndUpdate(user.sub, update, { new: true }).select('-passwordHash');
    return ok(doc);
  } catch (err) {
    console.error('[users/me PATCH]', err);
    return serverError();
  }
});
