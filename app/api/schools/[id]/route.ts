import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import School from '@/lib/db/models/School';
import { withAuth } from '@/lib/auth/middleware';
import { ok, badRequest, notFound, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

export const GET = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const school = await School.findById(id).lean();
    if (!school) return notFound('School not found');
    return ok({ school });
  } catch (err) {
    console.error('[GET /api/schools/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);

export const PATCH = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await req.json();

    const allowed = ['name', 'contactEmail', 'boardOfEducation', 'address', 'isActive'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) return badRequest('No valid fields to update');

    const school = await School.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!school) return notFound('School not found');
    return ok({ school });
  } catch (err) {
    console.error('[PATCH /api/schools/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
