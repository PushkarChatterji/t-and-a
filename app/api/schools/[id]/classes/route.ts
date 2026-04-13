import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Class from '@/lib/db/models/Class';
import School from '@/lib/db/models/School';
import { withAuth } from '@/lib/auth/middleware';
import { ok, notFound, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/schools/[id]/classes
export const GET = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;

    const school = await School.findById(id).lean();
    if (!school) return notFound('School not found');

    const classes = await Class.find({ schoolId: id })
      .sort({ grade: 1, section: 1 })
      .lean();

    return ok({ classes, total: classes.length });
  } catch (err) {
    console.error('[GET /api/schools/[id]/classes]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.TEACHER]);
