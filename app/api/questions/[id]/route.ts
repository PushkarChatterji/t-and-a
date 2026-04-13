import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Question from '@/lib/db/models/Question';
import { withAuth } from '@/lib/auth/middleware';
import { ok, badRequest, notFound, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';

type Ctx = { params: Promise<Record<string, string>> };

export const GET = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const question = await Question.findById(id).lean();
    if (!question) return notFound('Question not found');
    return ok({ question });
  } catch (err) {
    console.error('[GET /api/questions/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);

export const PATCH = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const body = await req.json();

    const allowed = [
      'edu_board', 'year', 'subject', 'chapter_name', 'section', 'section_name',
      'question_number', 'question', 'diagram', 'answer_options',
      'correct_answer_option', 'solution_explanation', 'difficulty_level',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) return badRequest('No valid fields to update');

    const question = await Question.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!question) return notFound('Question not found');
    return ok({ question });
  } catch (err) {
    console.error('[PATCH /api/questions/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);

export const DELETE = withAuth(async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const question = await Question.findByIdAndDelete(id).lean();
    if (!question) return notFound('Question not found');
    return ok({ deleted: true });
  } catch (err) {
    console.error('[DELETE /api/questions/[id]]', err);
    return serverError();
  }
}, [ROLES.ADMIN]);
