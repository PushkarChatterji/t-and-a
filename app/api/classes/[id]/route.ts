import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Class from '@/lib/db/models/Class';
import User from '@/lib/db/models/User';
import { withAuth } from '@/lib/auth/middleware';
import { ok, badRequest, notFound, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/classes/[id]
export const GET = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const cls = await Class.findById(id).lean();
    if (!cls) return notFound('Class not found');
    return ok({ class: cls });
  } catch (err) {
    console.error('[GET /api/classes/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.TEACHER]);

// PATCH /api/classes/[id]
export const PATCH = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await req.json();

    const allowed = ['name', 'grade', 'section', 'subject', 'academicYear', 'teacherIds'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) return badRequest('No valid fields to update');

    const cls = await Class.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!cls) return notFound('Class not found');
    return ok({ class: cls });
  } catch (err) {
    console.error('[PATCH /api/classes/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.MANAGEMENT]);

// DELETE /api/classes/[id] — hard delete (admin only)
export const DELETE = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const cls = await Class.findByIdAndDelete(id).lean();
    if (!cls) return notFound('Class not found');
    return ok({ deleted: true });
  } catch (err) {
    console.error('[DELETE /api/classes/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
