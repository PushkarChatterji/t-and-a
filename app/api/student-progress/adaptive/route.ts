import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { withAuth, getRequestUser } from '@/lib/auth/middleware';
import { ok, badRequest, serverError } from '@/lib/utils/api-response';
import { ROLES } from '@/lib/utils/constants';
import { getNextAdaptiveQuestion } from '@/lib/adaptive/engine';

// GET /api/student-progress/adaptive?topic=&board=&year=&subject=
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectDB();
    const user = getRequestUser(req)!;
    const { searchParams } = new URL(req.url);

    const chapter = searchParams.get('topic');
    if (!chapter) return badRequest('topic is required');

    const result = await getNextAdaptiveQuestion({
      userId: user.sub,
      chapter,
      board: searchParams.get('board') ?? undefined,
      year: searchParams.get('year') ?? undefined,
      subject: searchParams.get('subject') ?? undefined,
    });

    if (result.reason === 'exhausted' || !result.question) {
      return ok({ question: null, reason: 'exhausted', difficulty: result.difficulty });
    }

    return ok({ question: result.question, reason: result.reason, difficulty: result.difficulty });
  } catch (err) {
    console.error('[GET /api/student-progress/adaptive]', err);
    return serverError();
  }
}, [ROLES.INDIVIDUAL_STUDENT, ROLES.SCHOOL_STUDENT]);
