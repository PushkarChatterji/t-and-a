import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Question from '@/lib/db/models/Question';
import { withAuth } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    const andClauses: Record<string, unknown>[] = [];

    const board = searchParams.get('board');
    if (board) andClauses.push({ edu_board: board });

    const year = searchParams.get('year');
    if (year) andClauses.push({ year });

    const topic = searchParams.get('topic');
    if (topic) andClauses.push({ chapter_name: topic });

    if (andClauses.length > 0) filter.$and = andClauses;

    if (searchParams.get('subject')) filter.subject = searchParams.get('subject');
    if (searchParams.get('difficulty')) filter.difficulty_level = searchParams.get('difficulty');
    if (searchParams.get('q_type')) filter.q_type = searchParams.get('q_type');

    const [questions, total] = await Promise.all([
      Question.find(filter).skip(skip).limit(limit).lean(),
      Question.countDocuments(filter),
    ]);

    return ok({ questions, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/questions]', err);
    return serverError();
  }
});
