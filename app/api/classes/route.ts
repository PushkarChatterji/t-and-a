import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Class from '@/lib/db/models/Class';
import { withAuth } from '@/lib/auth/middleware';
import { getRequestUser } from '@/lib/auth/middleware';
import { ok, created, badRequest, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

// GET /api/classes?schoolId=&page=&limit=
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (searchParams.get('schoolId')) filter.schoolId = searchParams.get('schoolId');

    const [classes, total] = await Promise.all([
      Class.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Class.countDocuments(filter),
    ]);

    return ok({ classes, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/classes]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.TEACHER]);

// POST /api/classes — Admin or Management
export const POST = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const body = await req.json();
    const { schoolId, name, grade, section, subject, academicYear } = body;

    if (!schoolId || !name || !grade || !section || !academicYear) {
      return badRequest('Missing required fields: schoolId, name, grade, section, academicYear');
    }

    const cls = await Class.create({
      schoolId,
      name,
      grade,
      section,
      subject: subject || 'Maths',
      academicYear,
      teacherIds: [],
    });

    return created({ class: cls });
  } catch (err) {
    console.error('[POST /api/classes]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.MANAGEMENT]);
