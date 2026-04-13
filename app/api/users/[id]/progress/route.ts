import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/connection';
import StudentProgress from '@/lib/db/models/StudentProgress';
import User from '@/lib/db/models/User';
import { withAuth } from '@/lib/auth/middleware';
import { ok, notFound, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

// DELETE /api/users/[id]/progress — clear all progress for a user (admin only)
export const DELETE = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;

    const user = await User.findById(id).lean();
    if (!user) return notFound('User not found');

    const result = await StudentProgress.deleteMany({
      userId: new mongoose.Types.ObjectId(id),
    });

    return ok({ deleted: result.deletedCount });
  } catch (err) {
    console.error('[DELETE /api/users/[id]/progress]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
