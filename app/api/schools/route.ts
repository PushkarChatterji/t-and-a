import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import School from '@/lib/db/models/School';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, created, badRequest, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

// GET /api/schools
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (searchParams.get('search')) {
      const s = searchParams.get('search')!;
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { code: { $regex: s, $options: 'i' } },
      ];
    }

    const [schools, total] = await Promise.all([
      School.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      School.countDocuments(filter),
    ]);

    return ok({ schools, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/schools]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);

// POST /api/schools
export const POST = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const creator = getRequestUser(req)!;
    const body = await req.json();

    const { name, code, contactEmail, boardOfEducation, address } = body;
    if (!name || !code || !contactEmail) return badRequest('name, code and contactEmail are required');

    const existing = await School.findOne({ code: code.toUpperCase() });
    if (existing) return badRequest('School code already exists');

    const school = await School.create({
      name,
      code,
      contactEmail,
      boardOfEducation: boardOfEducation || 'CBSE',
      address: address || {},
      createdBy: creator.sub,
    });

    return created({ school });
  } catch (err) {
    console.error('[POST /api/schools]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
