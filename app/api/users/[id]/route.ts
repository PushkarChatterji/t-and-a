import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import { withAuth } from '@/lib/auth/middleware';
import { ok, badRequest, notFound, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/users/[id]
export const GET = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const user = await User.findById(id)
      .select('-passwordHash -emailVerificationToken -passwordResetToken')
      .lean();
    if (!user) return notFound('User not found');
    return ok({ user });
  } catch (err) {
    console.error('[GET /api/users/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);

// PATCH /api/users/[id]
export const PATCH = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await req.json();

    const allowed = ['firstName', 'lastName', 'role', 'isActive', 'subscriptionTier', 'schoolId', 'classId', 'boardOfEducation', 'class', 'adaptiveLearningEnabled'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) return badRequest('No valid fields to update');

    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true })
      .select('-passwordHash -emailVerificationToken -passwordResetToken')
      .lean();
    if (!user) return notFound('User not found');
    return ok({ user });
  } catch (err) {
    console.error('[PATCH /api/users/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);

// DELETE /api/users/[id] — hard delete
export const DELETE = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const user = await User.findByIdAndDelete(id).lean();
    if (!user) return notFound('User not found');
    return ok({ deleted: true });
  } catch (err) {
    console.error('[DELETE /api/users/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
