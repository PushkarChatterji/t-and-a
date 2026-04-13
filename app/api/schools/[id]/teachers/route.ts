import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import School from '@/lib/db/models/School';
import { withAuth } from '@/lib/auth/middleware';
import { ok, notFound, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/schools/[id]/teachers
export const GET = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;

    const school = await School.findById(id).lean();
    if (!school) return notFound('School not found');

    const teachers = await User.find({ schoolId: id, role: ROLES.TEACHER })
      .select('-passwordHash -emailVerificationToken -passwordResetToken')
      .sort({ lastName: 1, firstName: 1 })
      .lean();

    return ok({ teachers, total: teachers.length });
  } catch (err) {
    console.error('[GET /api/schools/[id]/teachers]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.MANAGEMENT]);
