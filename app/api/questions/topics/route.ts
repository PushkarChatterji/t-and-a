import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Question from '@/lib/db/models/Question';
import User from '@/lib/db/models/User';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const jwtUser = getRequestUser(req)!;
    const dbUser = await User.findById(jwtUser.sub).select('boardOfEducation class subject').lean();

    const filter: Record<string, unknown> = {};
    if (dbUser?.boardOfEducation) filter.edu_board = dbUser.boardOfEducation;
    if (dbUser?.class) filter.year = dbUser.class;
    if (dbUser?.subject) filter.subject = dbUser.subject;

    const chapters = await Question.distinct('chapter_name', filter);
    return ok(chapters.filter(Boolean).sort());
  } catch (err) {
    console.error('[GET /api/questions/topics]', err);
    return serverError();
  }
});
