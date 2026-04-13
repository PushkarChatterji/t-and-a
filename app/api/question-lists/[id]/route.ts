import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import QuestionList from '@/lib/db/models/QuestionList';
import Question from '@/lib/db/models/Question';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, badRequest, notFound, forbidden, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

// GET /api/question-lists/[id]
export const GET = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;

    const list = await QuestionList.findById(id).lean();
    if (!list) return notFound('Question list not found');

    // Populate questions
    const questions = await Question.find({ _id: { $in: list.questionIds } }).lean();

    return ok({ list, questions });
  } catch (err) {
    console.error('[GET /api/question-lists/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.TEACHER, ROLES.SCHOOL_STUDENT]);

// PATCH /api/question-lists/[id]
export const PATCH = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const { id } = await ctx.params;
    const body = await req.json();

    const list = await QuestionList.findById(id);
    if (!list) return notFound('Question list not found');

    // Only owner or admin can edit
    if (user.role !== ROLES.ADMIN && String(list.createdBy) !== user.sub) {
      return forbidden('You do not have permission to edit this list');
    }

    const allowed = ['title', 'description', 'questionIds', 'isPublished', 'board', 'class', 'subject', 'topic'] as const;
    for (const key of allowed) {
      if (key in body) (list as unknown as Record<string, unknown>)[key] = body[key];
    }

    await list.save();
    return ok({ list });
  } catch (err) {
    console.error('[PATCH /api/question-lists/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.TEACHER]);

// DELETE /api/question-lists/[id]
export const DELETE = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const { id } = await ctx.params;

    const list = await QuestionList.findById(id);
    if (!list) return notFound('Question list not found');

    if (user.role !== ROLES.ADMIN && String(list.createdBy) !== user.sub) {
      return forbidden('You do not have permission to delete this list');
    }

    await list.deleteOne();
    return ok({ deleted: true });
  } catch (err) {
    console.error('[DELETE /api/question-lists/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN, ROLES.TEACHER]);
