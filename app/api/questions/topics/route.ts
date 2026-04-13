import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Question from '@/lib/db/models/Question';
import { withAuth } from '@/lib/auth/middleware';
import { ok, serverError } from '@/lib/utils/api-response';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const filter: Record<string, unknown> = {};
    if (searchParams.get('board')) filter.edu_board = searchParams.get('board');
    if (searchParams.get('class')) filter.year = searchParams.get('class');
    if (searchParams.get('subject')) filter.subject = searchParams.get('subject');

    const chapters = await Question.distinct('chapter_name', filter);
    return ok(chapters.filter(Boolean).sort());
  } catch (err) {
    console.error('[GET /api/questions/topics]', err);
    return serverError();
  }
});
