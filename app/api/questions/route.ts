import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Question from '@/lib/db/models/Question';
import User from '@/lib/db/models/User';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const jwtUser = getRequestUser(req)!;

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    const andClauses: Record<string, unknown>[] = [];

    // Look up the student's own board and class from the DB — never trust client params
    const dbUser = await User.findById(jwtUser.sub).select('boardOfEducation class').lean();
    if (dbUser?.boardOfEducation) andClauses.push({ edu_board: dbUser.boardOfEducation });
    if (dbUser?.class) andClauses.push({ year: dbUser.class });

    const topic = searchParams.get('topic');
    if (topic) andClauses.push({ chapter_name: topic });

    if (andClauses.length > 0) filter.$and = andClauses;

    if (searchParams.get('subject')) filter.subject = searchParams.get('subject');
    if (searchParams.get('difficulty')) filter.difficulty_level = searchParams.get('difficulty');

    const [rawQuestions, total] = await Promise.all([
      Question.find(filter).skip(skip).limit(limit).lean({ virtuals: false }),
      Question.countDocuments(filter),
    ]);

    // Mongoose Map fields don't serialise via JSON.stringify — flatten them
    const questions = rawQuestions.map(q => ({
      ...q,
      answer_options: q.answer_options instanceof Map
        ? Object.fromEntries(q.answer_options)
        : (q.answer_options ?? {}),
    }));

    return ok({ questions, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/questions]', err);
    return serverError();
  }
});
