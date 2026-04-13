import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import Class from '@/lib/db/models/Class';
import { withAuth } from '@/lib/auth/middleware';
import { ok, notFound, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/classes/[id]/students
export const GET = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;

    const cls = await Class.findById(id).lean();
    if (!cls) return notFound('Class not found');

    const students = await User.find({ classId: id, role: ROLES.SCHOOL_STUDENT })
      .select('-passwordHash -emailVerificationToken -passwordResetToken')
      .sort({ lastName: 1, firstName: 1 })
      .lean();

    return ok({ students, total: students.length });
  } catch (err) {
    console.error('[GET /api/classes/[id]/students]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.TEACHER]);
